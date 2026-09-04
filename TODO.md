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
- **Institutional affiliations for most of the 47-person team roster.** Confirmed only
  for Atek, Chisholm, Kokorev, Fujimoto, and Basu. The remaining 42 members render
  without an institution line rather than a guess. Update `team/members.json` as
  affiliations are confirmed.
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
  included on `news.html` because those page bodies were not fetched and verified;
  only the two ESA/Webb items and the NASA/STScI release are shown.
