#!/usr/bin/env bash
# setup-environment.sh — Configure GCP infrastructure for rubik
#
# Usage:
#   ./scripts/setup-environment.sh <staging|production> [command]
#
# Commands:
#   all       — Run apis, secrets, triggers, iam (default)
#   apis      — Enable required GCP APIs
#   secrets   — Create secrets in Secret Manager
#   triggers  — Create Cloud Build triggers
#   iam       — Grant IAM roles to service accounts
#
# Prerequisites:
#   - gcloud CLI installed and authenticated (gcloud auth login)
#   - .env.staging or .env.production file exists (copy from .env.*.example)

set -euo pipefail

# ─── Args ────────────────────────────────────────────────────────────────────
ENV="${1:-}"
CMD="${2:-all}"

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "Usage: $0 <staging|production> [all|apis|secrets|triggers|iam]"
  exit 1
fi

ENV_FILE=".env.${ENV}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found. Copy .env.${ENV}.example and fill in values."
  exit 1
fi

# ─── Load environment ─────────────────────────────────────────────────────────
# shellcheck disable=SC1090
source "$ENV_FILE"

# ─── Validate required variables ─────────────────────────────────────────────
required_vars=(GCP_PROJECT_ID GCP_REGION GITHUB_REPO_OWNER GITHUB_REPO_NAME)
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Error: Required variable $var is not set in $ENV_FILE"
    exit 1
  fi
done

# Derived values
if [[ "$ENV" == "staging" ]]; then
  SERVICE_NAME="rubik-staging"
  BUILD_CONFIG="cloudbuild-staging.yaml"
  BRANCH_PATTERN="^develop$"
else
  SERVICE_NAME="rubik"
  BUILD_CONFIG="cloudbuild-production.yaml"
  BRANCH_PATTERN="^main$"
fi

PROJECT_NUMBER=$(gcloud projects describe "$GCP_PROJECT_ID" --format="value(projectNumber)")
CLOUDBUILD_SA="${CLOUD_BUILD_SERVICE_ACCOUNT:-${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com}"

echo "────────────────────────────────────────────────────────"
echo "  Environment : $ENV"
echo "  Project     : $GCP_PROJECT_ID"
echo "  Region      : $GCP_REGION"
echo "  Service     : $SERVICE_NAME"
echo "  Command     : $CMD"
echo "────────────────────────────────────────────────────────"

# ─── helpers ─────────────────────────────────────────────────────────────────
section() { echo; echo "▶ $1"; }

# ─── apis ────────────────────────────────────────────────────────────────────
setup_apis() {
  section "Enabling GCP APIs"
  gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    iam.googleapis.com \
    --project="$GCP_PROJECT_ID"
  echo "✓ APIs enabled"
}

# ─── secrets ─────────────────────────────────────────────────────────────────
setup_secrets() {
  section "Creating secrets in Secret Manager"

  # Helper: create or update a secret
  create_secret() {
    local name="$1"
    local value="$2"
    if gcloud secrets describe "$name" --project="$GCP_PROJECT_ID" &>/dev/null; then
      echo "  Updating secret: $name"
      echo -n "$value" | gcloud secrets versions add "$name" --data-file=- --project="$GCP_PROJECT_ID"
    else
      echo "  Creating secret: $name"
      echo -n "$value" | gcloud secrets create "$name" \
        --data-file=- \
        --replication-policy=automatic \
        --project="$GCP_PROJECT_ID"
    fi
  }

  # Add secrets here as they are needed. Read their values from the .env file.
  # The variable names in the .env file should match the secret values.
  #
  # Example:
  # if [[ -n "${MY_API_KEY:-}" ]]; then
  #   create_secret "my-api-key" "$MY_API_KEY"
  # fi

  echo "✓ Secrets configured (add yours in setup_secrets() as the project grows)"
}

# ─── triggers ────────────────────────────────────────────────────────────────
setup_triggers() {
  section "Creating Cloud Build trigger for $ENV"

  # Build substitutions string from env vars
  # Add _VITE_* vars here when the project needs them:
  SUBSTITUTIONS="_ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-*}"
  if [[ -n "${CLOUD_BUILD_SERVICE_ACCOUNT:-}" ]]; then
    SUBSTITUTIONS="${SUBSTITUTIONS},_CLOUD_BUILD_SERVICE_ACCOUNT=${CLOUD_BUILD_SERVICE_ACCOUNT}"
  fi

  TRIGGER_NAME="rubik-${ENV}"

  echo "  Trigger name   : $TRIGGER_NAME"
  echo "  Branch pattern : $BRANCH_PATTERN"
  echo "  Build config   : $BUILD_CONFIG"
  echo "  Substitutions  : $SUBSTITUTIONS"
  echo

  # Check for GitHub 2nd gen connection
  if ! gcloud builds connections describe "github-${GITHUB_REPO_OWNER}" \
       --region="$GCP_REGION" --project="$GCP_PROJECT_ID" &>/dev/null; then
    echo "⚠️  GitHub 2nd gen connection not found."
    echo "   Create it manually in the Cloud Build console:"
    echo "   https://console.cloud.google.com/cloud-build/repositories?project=$GCP_PROJECT_ID"
    echo "   Then re-run this script with: $0 $ENV triggers"
    return 0
  fi

  # Delete existing trigger if present (idempotent re-run)
  if gcloud builds triggers describe "$TRIGGER_NAME" \
     --region="$GCP_REGION" --project="$GCP_PROJECT_ID" &>/dev/null; then
    echo "  Deleting existing trigger: $TRIGGER_NAME"
    gcloud builds triggers delete "$TRIGGER_NAME" \
      --region="$GCP_REGION" --project="$GCP_PROJECT_ID" --quiet
  fi

  # Create trigger (GitHub 2nd gen)
  if gcloud beta builds triggers create github \
    --name="$TRIGGER_NAME" \
    --region="$GCP_REGION" \
    --repo-owner="$GITHUB_REPO_OWNER" \
    --repo-name="$GITHUB_REPO_NAME" \
    --branch-pattern="$BRANCH_PATTERN" \
    --build-config="$BUILD_CONFIG" \
    --substitutions="$SUBSTITUTIONS" \
    --project="$GCP_PROJECT_ID" 2>/dev/null; then
    echo "✓ Trigger created: $TRIGGER_NAME"
  else
    echo
    echo "⚠️  CLI trigger creation failed (common with GitHub 2nd gen)."
    echo "   Create it manually in the Cloud Build console with these settings:"
    echo
    echo "   Name           : $TRIGGER_NAME"
    echo "   Repository     : github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
    echo "   Branch         : $BRANCH_PATTERN"
    echo "   Build config   : $BUILD_CONFIG"
    echo "   Substitutions  : $SUBSTITUTIONS"
    echo "   Region         : $GCP_REGION"
    echo
    echo "   Console URL: https://console.cloud.google.com/cloud-build/triggers?project=$GCP_PROJECT_ID"
  fi
}

# ─── iam ─────────────────────────────────────────────────────────────────────
setup_iam() {
  section "Granting IAM roles"

  roles=(
    roles/cloudbuild.builds.builder
    roles/run.admin
    roles/iam.serviceAccountUser
    roles/storage.admin
    roles/artifactregistry.writer
    roles/logging.logWriter
    roles/secretmanager.secretAccessor
  )

  for role in "${roles[@]}"; do
    echo "  Granting $role to $CLOUDBUILD_SA"
    gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
      --member="serviceAccount:${CLOUDBUILD_SA}" \
      --role="$role" \
      --quiet
  done

  # Also grant Cloud Run's default compute SA access to secrets
  COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  echo "  Granting secretmanager.secretAccessor to Compute SA"
  gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

  echo "✓ IAM configured"
}

# ─── Run ─────────────────────────────────────────────────────────────────────
case "$CMD" in
  all)
    setup_apis
    setup_secrets
    setup_triggers
    setup_iam
    ;;
  apis)     setup_apis ;;
  secrets)  setup_secrets ;;
  triggers) setup_triggers ;;
  iam)      setup_iam ;;
  *)
    echo "Unknown command: $CMD"
    echo "Valid commands: all, apis, secrets, triggers, iam"
    exit 1
    ;;
esac

echo
echo "────────────────────────────────────────────────────────"
echo "✅ Done: $CMD for $ENV environment"
echo "────────────────────────────────────────────────────────"
