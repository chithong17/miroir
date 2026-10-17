# Public information website

Implemented in the existing React/Vite frontend; existing home and app routes remain intact.

| Path | Purpose |
| --- | --- |
| `/about` | Public MIROIR introduction / compact landing page |
| `/policies` | Information directory |
| `/privacy` | Privacy and data handling disclosure |
| `/ai-policy` | AI Try-on image processing and limitations |
| `/terms` | Draft service terms |
| `/delete-account` | Authenticated customer account deletion and email request path |
| `/support` | Support contact and FAQ |

Support address confirmed by the project owner: **miroirofficial20@gmail.com**.

## Verification

Run `npm run build`. For browser checks, start `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5182 --strictPort`, then `node scripts/check-public-pages.cjs`.

The browser script uses the existing `@playwright/test` installation in `mobile-rn` (or one installed for this frontend) and Microsoft Edge. It verifies mobile/desktop layouts and mocks login/deletion. It must never be changed to delete real accounts for QA. Screenshots go to ignored `mobile-rn/test-results/public-site/`.

## Deployment / publication checklist

- This task does not deploy, buy a domain, change DNS, or commit/push automatically. The existing Vercel catch-all rewrite supports direct navigation to the new routes once deployed.
- Confirm the actual public domain and use `https://<your-domain>/privacy`, `/terms`, `/delete-account`, `/support` as appropriate. Do not use localhost in store metadata.
- Configure `VITE_API_BASE_URL` to the deployed HTTPS backend ending in `/api`, with CORS allowing the actual frontend origin. Without it, the deletion form displays an error and offers email instead of calling a guessed server.
- Deploy the existing backend `DELETE /api/users/me/account` endpoint before advertising direct deletion. The page reauthenticates via `/api/user-auth/login`; its temporary token is kept in memory and never persisted.
- Verify receipt of mail at the confirmed address before publishing support promises. `mailto:` opens the visitor's mail app; it does not automatically send a ticket.
- Review and approve policy copy and identify the actual operating legal entity before official publication. Current policy pages explicitly label themselves under review; no legal compliance or store approval is claimed.
- Backend deletion currently removes the user, addresses, cart and Try-on task records. It does **not** purge orders, chats, remote images, provider records or backups. These limitations are disclosed; complete deletion/retention procedures still need implementation and approval.
- Do not copy unverified mobile-policy promises (automatic face removal, universal 24-hour image deletion, provider training restrictions, complete deletion) into the public pages.
- Review the existing in-app `mobile-rn/app/terms.tsx` separately: it still contains older, stronger claims and a different contact email. This web task does not silently alter the mobile app.
- Keep the disclosure and actual data handling aligned. Store guidance consulted: [Google Play deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111), [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

No new third-party tracker, analytics SDK, or frontend dependency was added.
