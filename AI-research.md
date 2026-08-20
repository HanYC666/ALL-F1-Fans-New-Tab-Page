# Research notes

These are the notes I used while deciding how to build the extension. They are kept here because they explain a few choices that are not obvious from the code.

## Chrome New Tab behaviour

An extension that uses `chrome_url_overrides.newtab` takes over the whole New Tab page. Chrome does not expose the native pinned tiles to extensions, so the project cannot read or preserve those exact tiles. The extension has its own Pinned Shortcuts card instead.

The Google box is an HTML form that sends `q` to Google. It looks familiar, but it is not the Chrome omnibox.

## F1 data

- Jolpica has been used for the schedule and driver standings. The adapter keeps the response in a small format that the widgets can use.
- OpenF1 is available for session data and may be used more as the project grows.
- Official F1 and FIA pages are linked for attribution. The extension does not scrape undocumented pages.
- Responses are cached locally. A failed refresh should show old data with a stale label instead of leaving the whole page blank.

The live standings request is the part confirmed during development. Provider limits and response formats should still be checked again before a public release.

## Can YouTube work with no API key?

There is an important difference between “the browser makes the request” and “the request needs no credentials.”

### What works without a key

The extension can open a URL such as:

```text
https://www.youtube.com/results?search_query=2026+Monaco+Race+commentary
```

That page is loaded by the user's browser. The user's normal YouTube cookies and account state stay with YouTube, and the extension does not need to read them. This is now the direct-search fallback in the Streams card.

Known-channel RSS feeds can also be used without a YouTube Data API key. They are useful for a fixed list of channels, but they cannot answer a general “find commentary for this race” search.

### What does not work as a proper no-key API

The official YouTube Data API search endpoint requires an API key or OAuth. Moving the `fetch()` call into the extension does not remove that requirement. It only exposes a key to every installed user if an API key is used.

The YouTube website has internal requests that can sometimes be seen in browser developer tools. Using those requests as an API would be fragile, could depend on cookies, would run into CORS and extension permission issues, and is not a stable supported integration. The page format can change at any time.

### Decision for this project

The extension supports both useful choices:

- Direct YouTube search for a completely client-side, no-key setup.
- An optional server proxy for structured results inside the widget. The proxy keeps the YouTube Data API key out of the extension and can cache requests to reduce quota use.

The proxy is not required for the F1 schedule or standings. Search results are never treated as proof that a stream is legal or official.

## Other client-side requests

Jolpica and OpenF1 are called from the extension with `fetch()`. They do not need a user API key in the current setup. Whether a website can be called directly still depends on that website's CORS rules, host permissions, rate limits, and terms. Cookies are not copied into the extension or sent to unrelated sites.

## Design decisions

The first version uses HTML, CSS, and JavaScript modules instead of a framework. Settings and small cached responses use `chrome.storage.local`; uploaded image data uses IndexedDB. This keeps the project easy to load as an unpacked extension and avoids adding a server unless a feature really needs one.

## References

- [YouTube Data API `search.list`](https://developers.google.com/youtube/v3/docs/search/list)
- [YouTube API authentication](https://developers.google.com/youtube/v3/guides/authentication)
- [YouTube API quota guide](https://developers.google.com/youtube/v3/determine_quota_cost)
