# Optional YouTube proxy

The extension can search YouTube without this server by opening YouTube's own
search page. This server is only needed when structured results should appear
inside the widget.

The endpoint in `youtube-search.js` accepts a small JSON request containing the
season, Grand Prix, session, and language. It calls the YouTube Data API,
returns video titles and links, and keeps a short in-memory cache. It does not
download videos, proxy playback, or decide whether a result is an authorised
broadcast.

## Running it

The file is written as a small Node-compatible handler so it can be adapted to a
serverless platform. Set these values in the platform's secret settings:

- `YOUTUBE_DATA_API_KEY` — the YouTube Data API key.
- `YOUTUBE_ALLOWED_CHANNEL_IDS` — optional comma-separated channel IDs.

Set the deployed HTTPS endpoint as `YOUTUBE_PROXY_URL` in the extension
configuration. Do not put the key in `src/`, `dist/`, extension storage, logs,
or a committed `.env` file.

Add platform-level rate limiting as well as the small in-process limiter in the
example. The hosting platform's logs and retention settings need to be included
in the final privacy notice.
