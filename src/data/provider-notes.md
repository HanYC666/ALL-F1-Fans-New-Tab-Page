# Provider notes

- Jolpica/Ergast-compatible: `https://api.jolpi.ca/ergast/f1`. The extension
  uses it for the schedule and driver standings. The live standings path has
  been checked during development.
- OpenF1: `https://api.openf1.org/v1`. The adapter is ready for session data,
  but coverage and limits should be checked before relying on it for a live
  feature.
- Official links: Formula 1 and FIA pages are linked for attribution. The
  extension does not scrape undocumented pages.
- Before publishing, record current provider terms, limits, and contact details
  here: `==F1_DATA_PROVIDER_CONTACT_OR_LIMITS==`.
