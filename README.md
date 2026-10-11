# Bid XI

A custom cricket auction studio with an animated broadcast player frame, separate projector tab, player and team management, budget and squad enforcement, sold/unsold rounds, undo, CSV results, printable squads, and live frame customization.

## Run

Node.js 22+ recommended.

```sh
npm ci --cache /tmp/bidxi-npm
npm run dev -- --port 5173
```

`npm run build` type-checks and creates `dist/`. `npm test` exercises the auction rules. `npm run preview` serves the production build.

## Current scope

This version is a single-browser workspace with fictional demo players. Results are saved in localStorage, not a cloud account. The projector opens with `?display=1` and receives changes from tabs of the same browser/origin. It is not a remote public display. Photo uploads are limited to 2 MB each; browser storage is finite, so export results regularly. CSV export includes player/team/price records. Team squads support browser print/save PDF.

Auction selection uses rejection sampling with browser crypto. This local implementation is suitable for evaluating the workflow; do not treat it as an authenticated multi-user production auction. New-tournament creation replaces the local tournament, with one undo available. Templates, file imports, sponsor assets, remote access, and full offline synchronization are future work.

## Deployment

Vercel: import this GitHub repository, select Vite, build `npm run build`, output `dist`. Render: create a Static Site, build `npm ci && npm run build`, publish `dist`, add an SPA rewrite `/*` to `/index.html`. Choose one host. Provider account access, current free-tier terms, and limits must be checked before deployment. No deployment or GitHub push is performed by this checkout.

## Supabase integration groundwork

`supabase/schema.sql` contains an initial organizer-scoped schema and row-level access policies. It is not applied or wired to the interface. Production integration needs authentication, atomic server-side auction transactions, realtime subscriptions, storage policies, and concurrency tests. Never expose a Supabase service-role key in the browser. Supabase project access is not available in this session.

## Design

Deep green/navy surfaces, warm gold highlights, condensed broadcast typography, restrained motion, and a configurable accent. Motion powers staged reveals and sale transitions. Reduced-motion preferences are respected. The initial generated logo is in `public/bid-xi-logo.png`; the interface uses a crisp typographic wordmark.
