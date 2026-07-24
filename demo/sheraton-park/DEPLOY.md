# Sheraton Park Groups Demo v2 — Deploy Notes

**What this is:** Concept demo of the groups vanity microsite from the July 2026 audit — hub + 5 segment landing pages, video hero, real property photography, meeting-space walkthrough videos, the complete 31-row capacity chart, per-segment RFP forms (visual only), and full SEO/AEO markup.

## Hidden deployment on doubledrook.com (Cloudflare Pages)

1. Copy this folder into your Pages project at `demo/sheraton-park/` (exclude any stray `.png` files — the site uses `.jpg`).
2. Deploy. Demo lives at `doubledrook.com/demo/sheraton-park/`.
3. Hidden by design: every page carries `<meta name="robots" content="noindex, nofollow, noarchive">`, nothing links to it, no sitemap entry. Optional root `_headers` addition:

```
/demo/sheraton-park/*
  X-Robots-Tag: noindex, nofollow
```

## SEO / AEO — built in, ready for launch

- **Structured data:** schema.org `Hotel` with `EventVenue` `containsPlace` entries (Park Ballroom, Tiffany Room/Patio, Lawn, Harbor & Garden Ballrooms with floor sizes + capacities), `FAQPage` on hub and meetings pages, `BreadcrumbList` on segment pages.
- **On-page:** unique titles/meta descriptions per page, OpenGraph/Twitter cards, semantic H1→H3 hierarchy, descriptive alt text, canonical URLs pointing at `sheratonparkanaheim.com` (the vanity domain target).
- **AEO:** FAQ questions mirror how planners phrase queries to AI answer engines ("largest event room," "how close to the convention center," "bus parking"), each answered with the canonical numbers.
- **At launch:** remove the robots noindex meta (flagged with an HTML comment in each file's head), update canonicals if the final domain differs, add a sitemap.xml, and submit to Search Console. Off-page AEO (reconciling Cvent/Expedia/Visit Anaheim data) is the audit's Phase 1 work — this site is the canonical source it points to.

## Content sourcing & rights

- **Photography:** the property's own images from its Marriott.com listing (cache.marriott.com), used here for a client-facing demo. Rights sit with Marriott/the hotel — fine for the pitch, confirm usage at production.
- **Videos:** `hero.mp4` (exterior + fireworks), `walk-meeting-room.mp4` (U-shape room), `walk-park-ballroom.mp4` (ballroom dolly) — AI-animated (Seedance 2.0) from the property's photos. Labeled as such in the demo bar/footer; replace with licensed footage in production.
- **Capacity chart:** all 31 rows verbatim from the property's Marriott.com capacity chart (July 2026), including Park A–H combinations, El Prado Foyer, Harbor/Garden rooms, Studios, Tiffany Room/Patio, Lawn, Garden Patio.

## Flags before showing the client

- **$33M renovation figure** — audit flagged the renovation number for confirmation; verify before public use.
- **Cultural-wedding catering** phrased as "ask our events team" — does NOT assert outside catering (pending F&B gate).
- **"Park Ballroom" vs "Park Plaza Ballroom":** Marriott's own weddings blurb still says "Park Plaza Ballroom" and "30,274 sq ft combined" — this site uses the capacity chart's "Park Ballroom" naming and the 34,892 sq ft events-hub total, consistent with the audit's one-source-of-truth recommendation. Worth flagging to the hotel as another on-brand inconsistency to fix.
- **runDisney:** intentionally absent per the hiatus exclusion.

## Key facts as published

34,892 sq ft · 17 event rooms · 15 breakouts · 31 configurations · Park Ballroom 10,934 sq ft — 1,100 theater / 900 reception / 680 banquet / 430 schoolroom · Tiffany Patio 500 reception / 300 banquet · Lawn 600 / 400 · 490 rooms / 395 two-queen · bus parking $250/night · WeddingWire 4.6, 92% recommend · ACC 1 block · ASC 2 mi · Honda Center & Angel Stadium ~4 mi · Bonvoy Events up to 60,000 points.
