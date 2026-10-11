# Bid XI

A cricket auction studio with a light ivory/cobalt dashboard, a branded sports presentation, synchronized GSAP shuffle and player reveal, canvas-confetti SOLD celebration, fullscreen operator controls, editable players, and a live frame designer.

## Run

Node.js 22+ recommended.

```sh
npm ci --cache /tmp/bidxi-npm
npm run dev -- --port 5173
```

`npm run build` type-checks and creates `dist/`. `npm test` exercises the auction rules. `npm run preview` serves the production build.

## Current scope

This version is a single-browser workspace with fictional demo players. Results are saved in localStorage, not a cloud account. The projector opens with `?display=1`. Player records and presentation events (shuffle/sold/unsold) synchronize between tabs of the same browser/origin. Use Show controls to run the auction in that tab, or hide controls for the audience. The expand button inside the studio opens fullscreen with a working control dock. It is not a remote public display. Photo uploads are limited to 2 MB each; browser storage is finite, so export results regularly. CSV export includes player/team/price records. Team squads support browser print/save PDF.

Auction selection uses rejection sampling with browser crypto. This local implementation is suitable for evaluating the workflow; do not treat it as an authenticated multi-user production auction. New-tournament creation replaces the local tournament, with one undo available. Bulk player imports, remote access, authenticated organizer accounts, and full offline synchronization are future work.

## Deployment

Vercel: import this GitHub repository, select Vite, build `npm run build`, output `dist`. Render: create a Static Site, build `npm ci && npm run build`, publish `dist`, add an SPA rewrite `/*` to `/index.html`. Choose one host. Provider account access, current free-tier terms, and limits must be checked before deployment. No deployment or GitHub push is performed by this checkout.

## Supabase integration groundwork

`supabase/schema.sql` contains an initial organizer-scoped schema and row-level access policies. It is not applied or wired to the interface. Production integration needs authentication, atomic server-side auction transactions, realtime subscriptions, storage policies, and concurrency tests. Never expose a Supabase service-role key in the browser. Supabase project access is not available in this session.

## Design

The website uses light ivory surfaces and cobalt controls. The actual generated logo is shown in the sidebar and frame. Three frame presets (Matchday, Classic, Spotlight) support background color/image, uploaded tournament/sponsor logos, sponsor name, photo side/fit/alignment, typography, visible player fields, accent and animation pacing. The included generated stadium background is available in the editor. Motion handles component transitions, GSAP coordinates the staged presentation, and canvas-confetti provides sale celebrations. No components from React Bits, Animata, or Tailwind Animations are copied: those sites were inaccessible during this work. Reduced-motion preferences are respected.

## Update an existing Windows checkout

Stop the running server with Ctrl+C, then:

```powershell
git pull origin main
npm install
npm run dev
```

Keep the terminal open. Visit the exact HTTP address printed by Vite, typically `http://localhost:5173/`. Old local player/team records are retained; new frame settings are filled in automatically. No paid services are required for the local version.

## Browser regression checks

With the app running, run `npm run test:browser`. Set `APP_URL` to use another port, and `CHROMIUM_PATH` for the local Chromium executable. The checks cover projector animations and controls, cross-tab undo, editing, saved data, frame uploads/layout, fullscreen and mobile overflow.
