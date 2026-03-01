# Deployment Reference

## Overview

| | Staging | Production |
|-|---------|------------|
| Branch | `develop` | `main` |
| Service | `rubik-staging` | `rubik` |
| URL | *(set when configured)* | *(set when configured)* |
| Cloud Build config | `cloudbuild-staging.yaml` | `cloudbuild-production.yaml` |
| Max instances | 5 | 10 |

## Docker image

```
gcr.io/rubik-atlas/rubik:<COMMIT_SHA>   ← pinned to each deployment
gcr.io/rubik-atlas/rubik:latest         ← always the most recent build
```

The same image name is used for both environments. The COMMIT_SHA tag ensures immutability.

## Vite build notes

This is a **static SPA** served via nginx. All environment variables must be prefixed `VITE_`
and are **baked into the bundle at build time**. There are no runtime server-side variables.

To add a new VITE_* variable:
1. Add `ARG VITE_FOO` + `ENV VITE_FOO=$VITE_FOO` to `Dockerfile`
2. Add `--build-arg VITE_FOO=$_VITE_FOO` to both `cloudbuild-*.yaml` files
3. Add `_VITE_FOO: ""` to the `substitutions` section of both Cloud Build files
4. Add `VITE_FOO=<value>` to `.env.staging` and `.env.production`
5. Update `setup-environment.sh` to include `_VITE_FOO=${VITE_FOO}` in `SUBSTITUTIONS`

## Rollback

### Immediate rollback via Cloud Run traffic splitting

```bash
# 1. List revisions
gcloud run revisions list \
  --service=rubik \
  --region=europe-west1 \
  --project=rubik-atlas

# 2. Route all traffic to a previous revision
gcloud run services update-traffic rubik \
  --to-revisions=<REVISION_NAME>=100 \
  --region=europe-west1 \
  --project=rubik-atlas
```

For staging, replace `rubik` → `rubik-staging`.

### Git rollback

To roll back the code, revert the offending commit(s) on `main` and push:
```bash
git revert <bad-commit-sha>
git push origin main
```
This triggers a new Cloud Build which redeploys the reverted state.

## First-time infrastructure setup

```bash
# Prerequisites: gcloud CLI authenticated, .env.staging and .env.production filled in

./scripts/setup-environment.sh staging all
./scripts/setup-environment.sh production all
```

See `docs/WORKFLOW.md` for the full workflow documentation.

## Monitoring

- Cloud Build: https://console.cloud.google.com/cloud-build/builds
- Cloud Run: https://console.cloud.google.com/run
- Container Registry: https://console.cloud.google.com/gcr/images
- Secret Manager: https://console.cloud.google.com/security/secret-manager
