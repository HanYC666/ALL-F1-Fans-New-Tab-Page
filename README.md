# F1 Fans New Tab

This is a Chrome New Tab extension made for people who want a full F1 dashboard every time they open a tab. It has a Google search box, the next race, driver standings, shortcuts, and background and layout settings.

It is a plain Manifest V3 extension. There is no framework, login system, analytics, or AI service running in the extension.

## What is in it

- A Google search form in the middle of the page.
- Race Weekend, Driver Standings, Pinned Shortcuts, and YouTube commentary cards.
- Background options: one image, random image, sequential images, and a slideshow.
- Local image uploads with file type, size, and image-dimension limits.
- Settings for colours, opacity, blur, widget visibility, layout, time format, and shortcuts.
- Export, import, and delete controls for local settings.

## A couple of Chrome limitations

Replacing the New Tab page replaces Chrome's own New Tab page too. Chrome does not provide an API for reading the native pinned tiles, so this project cannot keep those exact tiles. The Pinned Shortcuts card is the replacement and stores its links locally.

The search box is a normal Google form. It looks like Chrome search, but it is not the browser omnibox.

## Data sources

The dashboard currently gets schedule and standings data from Jolpica. The code also has an OpenF1 adapter for session data, although standings are the part that has been checked against a live response so far. The last good response is saved locally so the cards can still show something when the network is down.

The extension does not scrape F1 or YouTube pages. It uses public API endpoints where available and links to official sites for attribution.

## YouTube and API keys

There are two ways to use the YouTube card:

1. **No-key mode:** the extension builds a search URL and opens YouTube's own results page. The request, cookies, and page rendering are handled by the browser on YouTube. This needs no API key, but the extension cannot safely read or sort the results inside its own card.
2. **Proxy mode:** an optional server endpoint calls the YouTube Data API and sends back a few links and titles. The key stays on the server. This gives structured results in the card, but needs a deployed proxy and a YouTube API key on that server.

The official YouTube Data API does not offer anonymous search. A browser-only request to that API still needs an API key or OAuth. Scraping YouTube's internal search responses is not a dependable replacement: the format can change, CORS can get in the way, and it is not the supported API path. Known-channel RSS feeds can work without a key, but they do not provide general search.

For that reason, no-key mode is the fallback and proxy mode is optional. The card does not claim that a result is an authorised broadcast. Availability and rights depend on the uploader and the user's country.

## Project layout

```text
src/                 extension source
  newtab.html        page markup
  styles/            CSS
  js/                application code and widgets
  data/              teams, backgrounds, and provider notes
server/              optional YouTube proxy
scripts/             build and checks
test/unit/           automated tests
test/manual/         Chrome test checklist
dist/                generated extension (ignored by Git)
```

## Requirements

- Node.js 18 or newer for the checks and build.
- Chrome or another Chromium browser for trying the extension.
- Internet access for live F1 data. The basic page and saved data work offline.

There are no npm runtime dependencies at the moment.

## Run the checks

From the project folder:

```sh
npm test
npm run validate
npm run build
```

`npm test` runs the unit tests. `npm run validate` checks the manifest and scans for broad permissions, exposed API keys, and unsafe dynamic code. `npm run build` copies `src/` to `dist/`.

To use a different version in a release build:

```sh
EXTENSION_VERSION=0.1.1 npm run build
```

## Try it in Chrome

1. Run `npm run validate` and `npm run build`.
2. Go to `chrome://extensions`.
3. Turn on Developer mode.
4. Click **Load unpacked** and choose `dist/`.
5. Open a new tab.
6. After changing source files, build again and click **Reload** on the extension.

The longer manual checklist is in [`test/manual/checklist.md`](test/manual/checklist.md). A separate Chrome profile helps avoid mixing the extension with existing settings.

## Optional proxy configuration

The proxy is not needed for F1 standings or no-key YouTube searches. If it is deployed, keep these values outside the extension source:

| Value | Used for |
| --- | --- |
| `YOUTUBE_DATA_API_KEY` | Private key used by the server only |
| `YOUTUBE_PROXY_URL` | HTTPS URL called by the extension |
| `YOUTUBE_ALLOWED_CHANNEL_IDS` | Optional list of channels to label |

The other placeholders in `.env.example` are for support, privacy, publisher details, and image licensing. Fill them in before a public Web Store release. Never put a real API key in `src/`, `dist/`, extension storage, or a committed `.env` file.

## Privacy and permissions

The extension asks only for `storage`. It does not ask for browsing history, tabs, bookmarks, all-site access, or unlimited storage.

Settings, shortcuts, cached F1 responses, and uploaded backgrounds stay in the browser. There is no account or cloud sync. In no-key YouTube mode, the browser opens YouTube directly, so YouTube's own cookies and privacy rules apply. In proxy mode, the proxy can see the search request and normal server request metadata; its retention policy must be documented before deployment.

See [`PRIVACY.md`](PRIVACY.md) and [`server/README.md`](server/README.md).

## Current limitations

- Native Chrome pinned tiles cannot be imported automatically.
- The OpenF1 adapter is present, but the live standings path is the part confirmed so far.
- F1 APIs can change their limits or response formats, so provider details need checking before release.
- Built-in team photography is not included until the image licence is known.
- The proxy is optional infrastructure and is not deployed by this repository.
- A Web Store release still needs a real privacy-policy URL, support contact, publisher details, store images, and a clean-profile test.

## Other notes

- [`implementation_plan.md`](implementation_plan.md) is the original build plan.
- [`AI-research.md`](AI-research.md) contains the research notes, including the API-key investigation.
- [`task.md`](task.md) is the implementation checklist and verification record.
- [`CHANGELOG.md`](CHANGELOG.md) records what was actually added.
