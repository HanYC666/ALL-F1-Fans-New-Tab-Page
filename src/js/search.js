export function initSearch() {
  const form = document.querySelector("#google-search-form"),
    input = document.querySelector("#search-input");
  form.addEventListener("submit", (e) => {
    if (!input.value.trim()) {
      e.preventDefault();
      input.focus();
    }
  });
  return { focus: () => input.focus() };
}
export function safeExternalUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
export function youtubeSearchUrl(
  {
    season = new Date().getFullYear(),
    grandPrix = "Formula 1",
    session = "Race commentary",
  } = {},
) {
  const query = [season, grandPrix, session, "YouTube"].filter(Boolean).join(
    " ",
  );
  return `https://www.youtube.com/results?search_query=${
    encodeURIComponent(query)
  }`;
}
