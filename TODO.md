# TODO

Everything below is a known gap: a fact FACTS.md does not confirm, so the site shows a
visible `TBD` placeholder instead of a guess. Fill these in only from a verified
primary source.

- **Zenodo DOI for the GLIMPSE data release.** Not yet assigned; Hakim Atek is
  preparing the record. Update `data/products.json` (the relevant `url` fields) and
  the Zenodo card on `data.html` once it exists. See README.md for the exact steps.
- **Total survey area (imaging footprint, arcmin^2).** No source states this figure.
  Only the effective source-plane area at z~6 (~4.4 arcmin^2) is confirmed and used
  on the site. Do not add a footprint area number without a source.
- **F150W exposure time ambiguity.** The proposal PDF gives two different values in
  different sections (23 h on p.2, 20 h on p.14). The site states this range and notes
  the internal inconsistency neutrally rather than picking one number.
- **Team affiliations are as printed in the survey paper, not necessarily current.**
  All 47 institutions in `team/members.json` were read from the author block of
  Atek et al. 2025 (arXiv:2511.07542), so they reflect where each person was when that
  paper was submitted. Nobody has checked them against current positions. Update
  `team/members.json` when a member moves.
- **Public contact address for GLIMPSE / Hakim Atek.** No address is available to
  publish. `team.html` shows a `TBD` placeholder rather than an invented mailto link.
- **No GLIMPSE logo exists.** None was found in any source, and this build does not
  attempt to design one. The site uses the text wordmark "GLIMPSE" only. A 32x32 and
  64x64 favicon were cropped from the hero image instead of a logo mark.
- **Data product format, version, and size fields** in `data/products.json` are all
  `null` pending the actual data release; the table shows `TBD` pills for these until
  real values are known.
- **PIs of the unconfirmed Cycle 4/5 follow-up proposals** (#8498, #7745, #7709,
  #11008) are not published anywhere on the site, since FACTS.md could not confirm
  them.
- **Secondary press coverage** (AAS Nova items, the Science.org article) is not
  included on `news.html` because those page bodies were not fetched and verified.
- **Duplicate press coverage is collapsed on `news.html` by choice, not by omission.**
  Three cards are shown. The NASA/STScI release of 2026-06-10 (news-2026-119) covers the
  same result as the ESA/Webb release weic2610 and was dropped at the team's request, and
  the CNRS and Sorbonne Universite releases share a headline and date so they were merged
  into one card that links to both. All of these remain listed in FACTS.md.
- **Marcie Mun correction.** She is an author of Atek et al. 2026, not of the
  47-author survey paper (Atek et al. 2025, arXiv:2511.07542). She is deliberately
  absent from `team/members.json`, which reflects only the survey paper's roster.
- **Team portraits are used without an explicit licence.** The Co-PI headshots come from
  institutional directory pages that state no reuse terms. They are their own institutional
  photographs being shown on their own collaboration site, which is normal practice, but nobody has
  asked them. Confirm with Hakim Atek and John Chisholm, and swap in a photo they supply if they
  prefer one. See `images/CREDITS.md` for the exact sources.
- **No portrait for Hakim Atek yet.** The best verified photo found is the Sorbonne Universite
  portrait at https://www.sorbonne-universite.fr/en/portraits/hakim-atek , which the page labels
  `Hakim Atek (c) Pierre Kitmacher` with no reuse licence, so it was deliberately not published
  here. It is also a neutral, arms-folded portrait rather than the friendly headshot wanted. His
  personal site hakimatek.com is dead (DNS does not resolve), the IAP directory and the CNRS pages
  carry no photo of him, and the only other verified image (a 200x200 candid on savoirs.ens.fr) is
  too low quality. The simplest fix is to ask him for a headshot, or to get clearance from Sorbonne
  Universite communications or from Pierre Kitmacher.
