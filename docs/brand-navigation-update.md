# MTA public branding/navigation update — 5 October 2026

Scope: existing public UI, not a redesign. The admin's unrelated work is preserved.

- Resort collections use Gudauri/Kobi → Mestia → Bakuriani → Goderdzi. Live cards no longer override that sequence.
- Navigation remains in the existing bilingual CMS `navigation` records. `menuKind` selects a standard, resorts or today panel. Intro labels, descriptions, children and their URLs remain editable in Admin → Navigation. Mobile and desktop share the same records.
- `/ka/maps` and `/en/maps` are lightweight selectors linking to the four unchanged interactive resort-map routes. Only the homepage `MountainMap` mount is removed. Footer links to the old homepage map anchor are updated by the content migration.
- Safety is a direct navigation link. The prominent classification links are removed from the homepage and Safety overview; the underlying classification page and data remain available.
- Header artwork is the complete colored light-background-free English lockup extracted from the supplied official logo PDF. The source presentation-board backgrounds are excluded; no logo paths, proportions or colors are altered. Both locales share it. `scripts/extract-brand-vectors.py` reproduces the SVG assets from the supplied PDFs using PyMuPDF.
- The pass icon is the supplied PDF converted to an SVG mask. CTA colors remain predominantly black/white, with restrained exact MTA-red and blue interaction accents. Keyboard focus and reduced motion are supported.

## Content update

Build the API and run its existing explicit `--initialize` command with the normal secured database environment and `mta.api` content root. `BrandContentRefresh` uses one transaction and the bootstrap key `brand-navigation-official-news-20261005`; running it again does not overwrite subsequent edits or duplicate imports. Normal API startup never performs this editorial update. No schema migration is required.

Navigation IDs and revision history survive. Old navigation structures are retained in audit snapshots. Unchanged seed-demo news is unpublished (not deleted); copy edited by an admin is preserved. Existing non-demo articles are untouched. Four bilingual seasonal news summaries, source links, categories and official cover images are imported as ordinary editable News records.

Sources verified on 5 October 2026:

- Mestia: https://mta.ski/ge/presscenter/MestiaSummer2026_GE and https://mta.ski/en/presscenter/MestiaSummer2026_ENG
- Gudauri: https://mta.ski/ge/presscenter/SummerGudauri2026_Ge and https://mta.ski/en/presscenter/SummerGudauri26_ENG
- Goderdzi: https://mta.ski/ge/presscenter/GoderdziSummer2026_GE and https://mta.ski/en/presscenter/GoderdziSummer2026_ENG
- Bakuriani: https://mta.ski/ge/presscenter/Summer2026_GE and https://mta.ski/en/presscenter/Summer2026_Eng

Gudauri's official KA/EN dates differ (14/12 July), as do Bakuriani's (2/7 July). The original Georgian dates are used consistently in both locales. These are dated seasonal announcements, not live operational readings. Unavailable camera feeds retain their existing unavailable labels; no new fake feed or status data is introduced.

No GitHub push or Vercel deployment is part of this request.
