# MTA web design tokens

The owner approved retaining existing layout spacing and converting the supplied
English logo's U.S. Web Coated (SWOP) v2 colors to sRGB. These are derived screen
colors, not an official HEX table: red #EE4223, green #1EB585, yellow #FCB714,
cyan #25C3E9, black #040707, white #FFFFFF. The supplied Part 2 brand book covers
physical applications and does not define a web spacing or component system.

`src/app/globals.css` owns the Tailwind 4 color tokens. `brand-*` tokens preserve
the approved palette; canvas, surface, ink, muted, border, action, success,
warning, and danger express UI roles. Neutral surfaces are mixed from brand
black and white. Use ink on bright accent backgrounds for readable small text.
Status colors must always accompany text or an icon, not carry meaning alone.

`src/fonts/index.js` loads local normal-weight FiraGO (400–700) and supplied MTA
(300, 500, 900) through next/font. FiraGO is the body and control family; h1–h3
use MTA. Font variables are attached to the locale root layout. The FiraGO
license accompanies its files. No italic fonts or styles are used. Georgian UI
does not force uppercase because this FiraGO build lacks Mtavruli glyphs.

News cards are shared by the homepage and archive. Article content still comes
from the async news service; visual components do not import fixtures.
