# Development & Deployment Workflow

## Git branching strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — always deployable, protected |
| `develop` | Staging — integration branch |
| `feature/...` | Feature work — branched from and merged back to `develop` |

```
feature/my-feature  ──►  develop  ──►  main
                          (staging)    (production)
```

### Rules

- **Never commit directly to `main`** — always merge from `develop`.
- Feature branches are short-lived. Merge via PR to `develop`; delete after merge.
- All commits must be in **English** and follow [Conventional Commits](https://www.conventionalcommits.org/).

---

## Commit conventions

Format: `type(optional-scope): imperative description`

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no feat/fix |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, dependencies |

Examples:
```
feat(study): add OLL recognition thumbnails
fix(timer): correct ao5 calculation with DNF solves
chore(deps): update cubing to 0.56.0
docs(workflow): document release commands
```

---

## CI/CD — Cloud Build + Cloud Run

Two Cloud Build triggers fire on push:

| Branch | Trigger | Environment | Service |
|--------|---------|-------------|---------|
| `develop` | `cloudbuild-staging.yaml` | Staging | `rubik-staging` |
| `main` | `cloudbuild-production.yaml` | Production | `rubik` |

Each pipeline: build Docker image → push to GCR → deploy to Cloud Run → set public IAM.

The same image tag (`gcr.io/$PROJECT_ID/rubik:$COMMIT_SHA`) is used in both environments.

---

## Release commands

### `/release:staging`

Use inside Claude Code (or Cursor) to deploy `develop` to staging.

What it does:
1. Verifies you're on `develop` with a clean state
2. Runs `npm run build` locally
3. Commits any pending changes with a semantic message
4. Pushes to `origin/develop`
5. Reports the staging URL and Cloud Build link

**Deployment is automatic** — pushing to `develop` triggers Cloud Build.

---

### `/release:production`

> ⚠️ Requires **explicit confirmation** from the user before proceeding.

Use inside Claude Code to promote `develop` to production.

What it does:
1. Verifies branch state
2. **Asks for explicit confirmation** — shows full summary of what will happen
3. Runs `npm run build` locally
4. Merges `develop` into `main` (no-ff merge commit)
5. Determines next semver version and asks user to confirm
6. Creates an annotated tag (`v1.2.3`)
7. Pushes `main` and the tag to GitHub
8. Creates a GitHub release with auto-generated notes
9. Reports the production URL and Cloud Build link

**Deployment is automatic** — pushing to `main` triggers Cloud Build.

---

## Environment setup

First-time setup of GCP infrastructure:

```bash
# Copy templates and fill in your values
cp .env.staging.example .env.staging
cp .env.production.example .env.production
# Edit both files with your GCP project, URLs, etc.

# Run setup (enable APIs, create triggers, configure IAM)
./scripts/setup-environment.sh staging all
./scripts/setup-environment.sh production all
```

See `scripts/setup-environment.sh` for details.

---

## Rollback

```bash
# List available revisions
gcloud run revisions list --service=rubik --region=europe-west1

# Route all traffic to a specific revision
gcloud run services update-traffic rubik \
  --to-revisions=rubik-00023-abc=100 \
  --region=europe-west1
```

For staging, replace `rubik` with `rubik-staging`.
