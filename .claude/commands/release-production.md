---
description: "Deploy to production: merge develop→main, semver tag, GitHub release, trigger Cloud Build"
argument-hint: "[patch|minor|major] or version like v1.2.3"
---

Deploy to **production** (Cloud Run service `rubik`). Requires explicit confirmation before any irreversible step.

## Instructions

### 1. Verify branch and state

```bash
git branch --show-current
git status
```

Switch to `main` if needed. If there are uncommitted changes, ask the user to resolve them first.

### 2. STOP — require explicit confirmation

Show this summary and ask **"Do you want to proceed? (yes/no)"**:

> 🚨 **Production release**
>
> This will:
> 1. Merge `develop` → `main`
> 2. Create a semver tag
> 3. Push `main` + tag to GitHub
> 4. Create a GitHub release
> 5. Trigger Cloud Build → deploy to production Cloud Run
>
> **Confirm? (yes/no)**

Only continue if the user says yes explicitly.

### 3. Validate locally

```bash
npm run build
```

Abort if it fails. Ask the user to fix issues first.

### 4. Merge develop into main

```bash
git fetch origin
git log main..origin/develop --oneline
```

If there are commits to merge:
```bash
git checkout main
git merge origin/develop --no-ff -m "Merge develop to main: prepare release vX.Y.Z"
```

### 5. Determine next version

```bash
git tag --sort=-v:refname | head -5
```

Use commits since last tag to propose the bump:
- `fix` only → PATCH (1.0.0 → 1.0.1)
- `feat` → MINOR (1.0.0 → 1.1.0)
- `BREAKING CHANGE` → MAJOR (1.0.0 → 2.0.0)

If `$ARGUMENTS` contains `patch`, `minor`, `major`, or a version like `v1.2.3`, use that. Otherwise ask the user to confirm the version.

### 6. Create annotated tag

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

### 7. Push main and tag

```bash
git push origin main
git push origin vX.Y.Z
```

### 8. Create GitHub release

```bash
git log <previous-tag>..HEAD --oneline --no-merges
gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes
```

`gh` must be installed and authenticated (`gh auth login`).

### 9. Report result

> ✅ Release `vX.Y.Z` pushed to `main`. Cloud Build triggered.
>
> - **Cloud Build logs**: https://console.cloud.google.com/cloud-build/builds?project=rubik-atlas
> - **GitHub release**: https://github.com/ajramos/rubik/releases/tag/vX.Y.Z
> - **Production URL**: run `gcloud run services describe rubik --region=europe-west1 --project=rubik-atlas --format="value(status.url)"`

## Rollback

```bash
gcloud run revisions list --service=rubik --region=europe-west1 --project=rubik-atlas
gcloud run services update-traffic rubik --to-revisions=<REVISION>=100 --region=europe-west1 --project=rubik-atlas
```
