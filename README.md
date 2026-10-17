# GeoStamp Camera

A privacy-focused, mobile-first camera app with editable Indonesian timestamp and location watermarks. **Current milestone: M5 — UI polished, local production build ready.**

## Requirements and installation

Use Node.js 22.12+ (Node 22 LTS recommended) and npm 10+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173). Development binds to all interfaces for mobile layout checks on a local network. Camera access requires HTTPS or localhost; GPS is deferred to a later milestone.

## Commands

```sh
npm run dev           # Vite development server
npm run typecheck     # Strict TypeScript for app, configuration and browser tests
npm run lint          # ESLint, zero warnings
npm test              # Vitest + React Testing Library, single run
npm run test:watch    # Interactive unit tests
npm run test:e2e      # Legacy Playwright suite; deferred until after M5
npm run format:check # Prettier validation
npm run format       # Format source and configuration
npm run build        # TypeScript + production bundle in dist/
npm run preview      # Serve the production bundle locally
```

M5 implementation is in place and the deferred checks have now run. Use the built-in browser for browser checks; do not install Chromium. The legacy Playwright configuration remains available but requires a matching browser runtime if used separately. Prepared browser checks cover 320, 375, 390, 430 and 1280px widths, shell centering, overflow, both preview ratios, and no camera/GPS requests before activation. Prepared unit tests cover entry controls, ratio selection and crop geometry. None verifies real camera hardware.

## Structure

```text
src/
  app/                        App composition, mobile shell and global theme
  features/camera/
    components/               Camera controls and live preview
    hooks/                    Camera lifecycle and photo import
    store/                    Zustand ratio preference
  features/editor/            Initial editor, Canvas crop preview and photo store
  features/images/            Orientation decoding and shared photo renderer
  features/metadata/          Form, GPS, provider adapter and normalization
  features/watermark/         Settings, bounded layout, Canvas renderer and drag controls
  features/export/            Memory-bounded native/compact JPG rendering and workflow
  features/pwa/               Offline, install and update status
  components/ui/              Local shadcn/ui primitives
  lib/                        Shared utilities
  test/                       Testing Library setup
 tests/e2e/                   Playwright browser tests
```

React 19, Vite, strict TypeScript, Tailwind CSS v4 with its Vite plugin, and shadcn/ui CSS variables and aliases are configured. The shared Button follows the shadcn Radix Slot/CVA pattern. `components.json` supports adding more primitives with the shadcn CLI. Runtime dependencies include Zustand, React Hook Form, Zod, its form resolver and date-fns for later work. `vite-plugin-pwa` is installed for a future milestone.

Setup references: [Tailwind Vite installation](https://tailwindcss.com/docs/installation/using-vite), [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual).

## Camera and image import

- Explicit **Aktifkan kamera** requests video only, initially preferring the rear camera. Microphone access is never requested. GPS is optional and requested separately from the metadata editor.
- Camera access requires HTTPS or localhost. Access from a phone via a plain HTTP LAN address can still use gallery import, but cannot activate the camera. Permission denial, unavailable/busy cameras, unsupported APIs and interrupted streams have Indonesian error messages and recovery actions.
- Front/rear switching uses enumerated camera device IDs where possible, otherwise an exact facing-mode request. Preview is intentionally unmirrored, so the captured crop matches the preview. The shutter is enabled only after decoded video frames are available.
- Camera streams stop when entering the editor, stopping/cancelling the camera, unmounting the screen or backgrounding/leaving the page. Resume explicitly with the activation button. Late permission results are discarded and stopped.
- Gallery import accepts JPEG, PNG, WebP, AVIF and HEIC/HEIF when supported by the browser. Native decoders apply EXIF orientation; local PNG normalization stores those oriented pixels without EXIF orientation tags. Unsupported or corrupt images show an error. Animated formats are not accepted.
- Images are limited to 50 MiB input, 40 MP decoded dimensions and 16384px per side to reduce mobile memory/canvas errors. Decoding remains subject to device memory limits. No downsampling is performed.
- Capture retains the full video frame at the negotiated stream resolution (not the camera sensor's maximum still-photo resolution). Gallery import retains all oriented source pixels. Both enter **Edit foto** with a normalized center crop in the selected 3:4 or 9:16 ratio.
- Editor preview uses the shared Canvas crop renderer; drag or accessible horizontal/vertical sliders adjust the crop. Ratio changes and **Pusatkan** reframe without changing the original source. Returning to the camera discards the current in-memory photo and releases its object URL.
- Capture/import records device time at shutter/file selection. Gallery EXIF time/location is not extracted. Metadata and watermark can now be edited; JPG export is available after watermark editing.
- No backend, database, authentication, analytics, external fonts or image uploads. Photos stay in memory on the device, and are not saved across reloads.
- The production build includes an installable PWA manifest, app icons and service worker. After the first successful online load, the app shell can open offline. Reverse geocoding still requires internet. Photos remain memory-only and are discarded on reload.

## Timestamp, location and watermark

After capture/import, edit the local timestamp, short address, kabupaten/kota, province, country and optional coordinates. Date formatting defaults to Indonesian, for example `Minggu, 18 Oktober 2026, 02:04:00`. Location can remain entirely blank. No sample address or approximate/IP location is substituted when GPS fails.

**Gunakan GPS saat ini** asks for current device location and sends coordinates to Photon/OpenStreetMap to retrieve an address; photos stay local. The provider uses nearby mapped data and may omit fields or return a different street, so review/edit the result. Current GPS on a gallery image is not EXIF location. Permission, network and provider failures leave the manual workflow available. Attribution is displayed in the editor.

Photon's [public demo usage guidance](https://github.com/komoot/photon#demo-server) permits moderate traffic with no availability guarantee. An alternative Photon-compatible endpoint can be configured with public build-time `VITE_PHOTON_REVERSE_URL`. No API keys are needed. Do not place secrets in VITE variables. Only explicit user requests trigger lookups; there is a short cooldown and session cache. See [Photon API docs](https://github.com/komoot/photon/blob/master/docs/api-v1.md).

Switch to **Watermark** to drag the bounded overlay, or use keyboard arrows/position sliders. Customize font family/size/weight, text/background color, opacity and alignment. Top-right is the default. Both crop and watermark are drawn on Canvas through `renderPhoto`, the shared entry point for later export. Long text wraps and can shrink to fit. Original photo pixels remain unchanged.

## Watcher ELOOP repair

Removed the self-referencing `vercel-react-view-transitions` skill symlink; retained the installed skill folders. Vite ignores `.agents` and does not follow directory symlinks; Tailwind explicitly scans `src`. Restart an already-running dev server to load the changed configuration. Runtime verification is deferred until M5.

## Export and memory limits

From **Watermark**, choose **Lanjut ke simpan JPG**, select native/compact resolution and quality (60–100%), then **Siapkan JPG**. Inspect the result, download it, re-edit, or confirm a new photo. The browser cannot prove that you saved a file; the UI reports a download request. Supported devices also offer system file sharing. JPG uses the same renderer as preview; transparent areas flatten to white, and no GPS EXIF metadata is copied.

Native output retains the selected crop at source resolution (rounded down by whole aspect-ratio units). It never silently shrinks. For memory safety, native export is capped at 12MP on devices reporting <=4GB memory, otherwise 24MP. Choose compact (long side <=2048px) if native export is rejected. Actual limits vary by browser. Source URLs, decoded images, temporary Canvases and result URLs have explicit cleanup paths; see QA notes for tested scope.

## PWA and free public hosting

Production build generates `manifest.webmanifest`, `sw.js` and Workbox assets. Serve all of `dist/` from an HTTPS root, not from a subpath. Do not cache photos or provider responses in the service worker. Updates are prompted and blocked while a photo is open. Save the JPG before refreshing/updating.

The app has not been published. Follow [the Cloudflare Pages guide](docs/DEPLOYMENT.md) for free, public HTTPS hosting with a dashboard upload and no CLI installation. `.openai/hosting.json` identifies an empty private Sites target created before the user changed the request to instructions only; no version was pushed or deployed. The app needs no backend, database or application secrets. For an alternative free host, upload the contents of `dist/` to an HTTPS static host that supports a root-scope service worker; do not publish the source directory or node_modules. No deployment CLI needs to be installed for a dashboard upload.

## QA scope

See `docs/m4-m5-qa.md` for passed checks and unresolved device/browser limits. Tests include simulated denial/network failures and resource cleanup. The built-in browser checked responsive layout, import, camera stream/capture, manual metadata, drag, actual JPG download, re-edit/retake and cached shell reload with the local server stopped. All eight EXIF orientation browser checks were blocked by declined upload approval. Safari/Firefox and physical mobile devices remain unverified.

## Verification record

See `docs/m4-m5-qa.md`, `docs/m2-m3-implementation.md`, `docs/m1-implementation.md` and the historical `docs/m0-verification.md` for actual commands, results and any environment limitations from implementation. No real-device camera or GPS testing is claimed.
