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

A Cloud Build trigger fires on push to `main`:

| Branch | Build config | Service |
|--------|--------------|---------|
| `main` | `cloudbuild-production.yaml` | `rubik` (europe-west1) |

Pipeline: build Docker image → push to GCR → deploy to Cloud Run → set public IAM.

Image tag: `gcr.io/rubik-atlas/rubik:$COMMIT_SHA`

The trigger must be created manually in the Cloud Build console (GitHub 2nd gen connections
do not support CLI creation reliably). See `DEPLOYMENT.md` for exact settings.

---

## Release commands

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
# Copy template and fill in your values
cp .env.production.example .env.production
# Edit with your GCP project, region, GitHub repo, etc.

# Run setup (enable APIs, create rubik-cloudbuild SA, configure IAM)
./scripts/setup-environment.sh production all
```

After `all` completes, create the Cloud Build trigger manually in the console
(see `DEPLOYMENT.md` for the exact settings).

See `scripts/setup-environment.sh` for details on individual commands.

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

