---
description: Deploy latest origin/main to fleetiqlogistics.com production
allowed-tools: Bash
argument-hint: "[--skip-confirm]"
---

# Deploy to Production

Deploy the latest code from `origin/main` to the FleetIQ production server (Hetzner CPX11, `5.78.218.253` → fleetiqlogistics.com). This command assumes commits are already pushed to `origin/main`.

## Server details

- Host: `root@5.78.218.253`
- App dir: `/var/www/fleet-management`
- Build script: `bash /var/www/fleet-management/build.sh` (git pull → frontend build → backend build → PM2 restart)
- PM2 process: `fleet-api`

## Steps

Execute these in order. If any step fails, **stop immediately** and report — do not auto-retry, do not skip checks.

### 1. Verify SSH key auth is set up

Run:

```
ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new root@5.78.218.253 'echo ssh-ok'
```

If this fails with permission denied: **stop**. Tell the user to run `ssh-copy-id root@5.78.218.253` once from their terminal (they'll type the root password one time), then retry `/deploy`. Do not attempt to deploy without key auth.

### 2. Show what will be deployed

Run `git fetch origin` then show `git log --oneline -5 origin/main` so the user can see exactly what's about to ship. Also compare against the currently deployed commit by running over SSH:

```
ssh root@5.78.218.253 'cd /var/www/fleet-management && git rev-parse --short HEAD && git log -1 --pretty=%s'
```

Display: "currently live: `<short-sha>` — `<commit subject>`" and "about to deploy: `<short-sha>` — `<commit subject>`".

### 3. Confirm with the user

Unless `$ARGUMENTS` contains `--skip-confirm`, ask the user to confirm before deploying. If origin/main and the live commit are the same SHA, ask whether they really want to redeploy (likely a no-op rebuild).

### 4. Run the build script on the server

Run:

```
ssh root@5.78.218.253 'bash /var/www/fleet-management/build.sh'
```

Stream the output so the user can see git pull, npm install, build, and PM2 restart progress. If the command exits non-zero, **stop** and report the failure.

### 5. Verify the deploy is healthy

After build.sh finishes:

1. `ssh root@5.78.218.253 'pm2 jlist'` and parse for `fleet-api` — confirm `pm2_env.status === "online"` and `restart_time` increased.
2. `curl -sS -o /dev/null -w "%{http_code}" https://fleetiqlogistics.com/` — expect `200`.
3. `curl -sS -o /dev/null -w "%{http_code}" https://fleetiqlogistics.com/api/auth/admin` — expect `401` (route exists, auth required). A `502` means the backend didn't come up — report it.

### 6. Report

One-line summary: deployed SHA, time taken, PM2 status, and the two HTTP probes. Done.

## Safety notes

- `build.sh` runs `git reset --hard` on the server before `git pull`. Any uncommitted local changes on the server are discarded — that's intentional, but worth knowing.
- This command does **not** push your local commits. If `git log origin/main..HEAD` is non-empty, warn the user that their local commits won't be deployed.
- Don't pass `--skip-confirm` unless the user explicitly asked for an unattended deploy.
