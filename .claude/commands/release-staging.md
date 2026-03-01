---
description: "Deploy develop branch to staging via Cloud Build (build, validate, commit, push)"
argument-hint: "[optional commit message]"
---

Deploy the current state of `develop` to the staging environment (Cloud Run service `rubik-staging`).

## Instructions

### 1. Verify branch

Run:
```bash
git branch --show-current
```
If not on `develop`, ask the user whether to switch or abort.

### 2. Check working tree

Run:
```bash
git status
```

- **Uncommitted changes** → ask: commit now, stash, or abort?
- **Clean tree** → skip to step 4.

### 3. Commit pending changes (if the user wants to commit)

Validate first:
```bash
npm run build
```

If build passes, stage and commit using a semantic message in English:
```bash
git add -A
git commit -m "type(scope): description"
```

Commit types: `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`

If `$ARGUMENTS` was provided, use it as the commit message body or description.

### 4. Push to develop

```bash
git push origin develop
```

### 5. Report result

Tell the user:

> ✅ Pushed to `develop`. Cloud Build will trigger automatically.
>
> - **Cloud Build logs**: https://console.cloud.google.com/cloud-build/builds?project=rubik-atlas
> - **Staging URL**: run `gcloud run services describe rubik-staging --region=europe-west1 --project=rubik-atlas --format="value(status.url)"` after the first deploy.
>
> Deployment takes ~3–5 minutes.

## Commit convention

Format: `type(scope): imperative description` — always in English.

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic |
| `refactor` | Restructuring, no feat/fix |
| `chore` | Build, tooling, deps |
