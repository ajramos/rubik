#!/usr/bin/env bash
# setup-environment.sh — Configure GCP infrastructure for rubik
#
# Usage:
#   ./scripts/setup-environment.sh <staging|production> [command]
#
# Commands:
#   all       — Run apis, secrets, iam (default)
#   apis      — Enable required GCP APIs
#   secrets   — Create secrets in Secret Manager
#   iam       — Create rubik-cloudbuild SA and grant IAM roles
#   triggers  — Print manual trigger creation instructions (console only)
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
# Cloud Build triggers with GitHub 2nd gen connections must be created manually
# via the console — the CLI does not support this reliably.
setup_triggers() {
  section "Cloud Build trigger — create manually in the console"
  echo "  URL            : https://console.cloud.google.com/cloud-build/triggers?project=$GCP_PROJECT_ID"
  echo
  echo "  Name           : rubik-${ENV}"
  echo "  Region         : $GCP_REGION"
  echo "  Event          : Push to a branch"
  echo "  Repository     : github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
  echo "  Branch         : $BRANCH_PATTERN"
  echo "  Build config   : $BUILD_CONFIG"
  echo "  Service account: rubik-cloudbuild@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
  echo "  Substitutions  : _ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-*}"
  echo
  echo "  ⚠️  Run 'iam' first so the rubik-cloudbuild SA exists before creating the trigger."
}

# ─── iam ─────────────────────────────────────────────────────────────────────
setup_iam() {
  section "Configuring IAM"

  DEDICATED_SA="rubik-cloudbuild@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

  # Create dedicated SA if it doesn't exist
  if ! gcloud iam service-accounts describe "$DEDICATED_SA" \
       --project="$GCP_PROJECT_ID" &>/dev/null; then
    echo "  Creating service account: rubik-cloudbuild"
    gcloud iam service-accounts create rubik-cloudbuild \
      --display-name="Rubik Cloud Build" \
      --project="$GCP_PROJECT_ID"
  else
    echo "  Service account already exists: rubik-cloudbuild"
  fi

  # Roles needed to build, push to GCR, deploy to Cloud Run, and write logs.
  # secretmanager.secretAccessor is included for future use; remove if not needed.
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
    echo "  Granting $role to rubik-cloudbuild"
    gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
      --member="serviceAccount:${DEDICATED_SA}" \
      --role="$role" \
      --condition=None \
      --quiet
  done

  echo "✓ IAM configured — SA: $DEDICATED_SA"
}

# ─── Run ─────────────────────────────────────────────────────────────────────
case "$CMD" in
  all)
    setup_apis
    setup_secrets
    setup_iam
    echo
    setup_triggers  # print manual instructions last
    ;;
  apis)     setup_apis ;;
  secrets)  setup_secrets ;;
  iam)      setup_iam ;;
  triggers) setup_triggers ;;
  *)
    echo "Unknown command: $CMD"
    echo "Valid commands: all, apis, secrets, iam, triggers"
    exit 1
    ;;
esac

echo
echo "────────────────────────────────────────────────────────"
echo "✅ Done: $CMD for $ENV environment"
echo "────────────────────────────────────────────────────────"
