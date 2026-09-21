# Deployment and verification

The user requests both deployments after each completed website change:

- GitHub repository: `https://github.com/Moreda313/MM_Wedding_Invitation.git`, branch `main`.
- Production server: `root@47.83.183.251`, exact web directory `/var/www/mm-wedding/`.
- Production URL: `https://wedding.moreda.me/`.
- GitHub Pages URL: `https://moreda313.github.io/MM_Wedding_Invitation/`.

Workflow:

1. Preserve unrelated user changes; run relevant tests and the build.
2. Commit only task changes and push `main`; the existing Actions workflow builds Pages with its own base and `VITE_SITE_URL`.
3. Run `npm run build` for the server. Its default base is `/` and its sharing URL is `https://wedding.moreda.me/`. Never upload a Pages/subdirectory build to the server.
4. Confirm SSH access with noninteractive authentication and validate that `/var/www/mm-wedding/` resolves to that exact directory. Do not change credentials, SSH trust or server configuration without authorization.
5. Preview synchronization with `rsync -avzn --delete dist/ root@47.83.183.251:/var/www/mm-wedding/`. Review deletions. Stop if unrelated files or server configuration would be removed. Then synchronize the validated build (prefer `--delay-updates --delete-delay` for the actual copy). The user authorized mirroring this exact web directory, not any parent directory.
6. Verify BOTH public URLs after deployment, not just the successful push/upload. Check the expected HTML/asset version, sharing URLs and JPEG HTTP status/content type, and browser behavior relevant to the change. `scripts/verify-share.mjs` defaults to the production canonical URL; set `EXPECTED_SITE_URL` for Pages.
7. Report server and Pages results separately. Do not claim production is updated while only Pages is updated. If SSH or deployment is blocked, explain the blocker and leave the correct root-path `dist/` ready.

Keep passwords, private keys and tokens out of source, logs and chat. Stop temporary preview servers started for the task. Do not rebuild shared `dist/` while preview tests using it are still running.
