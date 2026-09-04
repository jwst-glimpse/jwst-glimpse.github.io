# The GLIMPSE website

This is the source for the GLIMPSE (JWST GO 3293) public website, published at
`https://jwst-glimpse.github.io/`. It is a plain set of HTML, CSS, and JavaScript files.
There is no build step and no framework, so you can edit most of the content by
editing a text file and pushing the change. This document explains how, without
assuming any web development background.

## How the site is deployed

The site is hosted by GitHub Pages directly from this repository. Whatever is on the
`main` branch is what visitors see, usually within a minute or two of a push. There is
nothing to compile or upload separately. If something looks wrong after a push, check
the "Actions" tab of the repository on GitHub for errors, and check that you edited the
file you meant to (paths are listed below).

## The GLIMPSE logo

The four official logo files live in `images/logo/`, straight from the collaboration's own Logos
folder on Google Drive, at full resolution (6584 x 2321, transparent background):

- `Glimpse-JWST-Logo-Color-Light.png` and `-Grayscale-Light.png` for dark backgrounds
- `Glimpse-JWST-Logo-Color-Dark.png` and `-Grayscale-Dark.png` for light backgrounds

Use these for talks and posters rather than pulling a screenshot off the website. The site's own
header logo (`images/glimpse-logo.png`) and the favicons are generated from the Color-Light file,
so if the logo ever changes, replace the originals and regenerate those.

## How to add a new paper

The Publications page lists **papers led by the GLIMPSE team**. Papers by other groups
that use the public GLIMPSE data are deliberately left off, so the list stays a record
of the collaboration's own output.

Publications are listed automatically from `pubs/pubs.json`, which is generated from
`pubs/bibcodes.txt`. You do not need to edit `pubs/pubs.json` by hand.

1. Open `pubs/bibcodes.txt` in this repository.
2. Add a new line with the paper's ADS bibcode, for example:

   ```
   2026ApJ...999...99A  # Atek, Hakim 2026, Short title of the paper
   ```

   The `#` comment is optional but helpful; it is ignored by the code.
3. Commit and push. A scheduled GitHub Action runs every week, fetches the latest
   metadata for every bibcode in that file from ADS, and updates `pubs/pubs.json`
   automatically. You can also trigger it immediately from the "Actions" tab
   ("Update publications" workflow, "Run workflow" button) instead of waiting for the
   weekly run.

Separately, that same weekly check searches ADS for other papers that mention GLIMPSE
and Abell S1063 and might belong on the list. It never adds them automatically (the
word "GLIMPSE" also belongs to an older Spitzer survey and to the English word
"glimpse", so that search is noisy). Instead it writes candidates to
`pubs/candidates.json`, which is not shown on the website. Check that file
occasionally; if a listed candidate is a GLIMPSE team paper, add its bibcode to
`pubs/bibcodes.txt` yourself. Most candidates will be papers by other groups using the
public data, and those should stay off the list.

## How to add or edit a data product

The Data page's product table is generated from `data/products.json`. Open that file
and edit the entry for the relevant product, or copy an existing entry and adjust it
for a new one. Each product has:

- `name`, `description`: what it is.
- `format`, `version`, `size`: leave these as `null` (no quotes) until you know the
  value; the site displays a "TBD" marker automatically for anything null.
- `url`: leave as `null` until there is a real download link (for example once the
  Zenodo record exists), then paste the link in quotes.
- `notes`, `release`: free text, and one of `"DR1"`, `"DR2"`, or `"DR3"`.

## Plugging in the Zenodo DOI once it exists

Two small edits, once Zenodo assigns the record its DOI:

1. In `data/products.json`, set the `url` field of the relevant product(s) to the
   Zenodo download link.
2. In `data.html`, find the Zenodo card in the "How to get the data" section and
   replace the `TBD` DOI text and the disabled "Link pending" button with the real
   DOI and an active link.

## How to add a news item

Open `news.html` and copy an existing news card (the block starting with
`<article class="news-card">`), then edit the date, outlet, headline, link, and
summary. Only add items you can support with a real, fetched source; do not
paraphrase a headline you have not actually read. If there is an official image for
the item, include it with its full, verbatim credit text, exactly as required for
every other image on the site.

## How to add or fix a team member's institution

Team members are listed in `team/members.json`, in the same order as the author list
of the survey paper. To add or correct someone's institution, find their entry
(matched by `name`) and set `institution` to the correct string in quotes. If you are
not sure of the correct wording, leave it as `null`; the site simply omits the
institution line for anyone whose affiliation is not filled in, rather than showing a
guess.

The `role` field is `"Co-PI"` for the two Co-PIs and `null` for everyone else. If a
different formal role needs recording, edit that field the same way.

## Editing ordinary page text

Pages like `index.html`, `survey.html`, and `team.html` are ordinary HTML files with a
shared header, footer, and stylesheet. Text you want to change is usually inside a
`<p>...</p>` paragraph or a table cell; you can edit it directly. If you are unsure
about HTML syntax, it is safest to ask whoever manages the site day to day (currently
Seiji Fujimoto) to make structural changes, and to reserve direct edits for updating
wording, numbers you have confirmed, or links.

## Where things live

```
index.html, survey.html, data.html,     the six pages
  publications.html, team.html, news.html
assets/css/style.css                    all page styling, one file
assets/js/site.js                       the code that renders the publications,
                                         data products, and team tables from JSON
pubs/bibcodes.txt                       curated list of papers (edit this)
pubs/pubs.json                          generated from bibcodes.txt, do not hand-edit
pubs/candidates.json                    possible new papers awaiting your review
data/products.json                      data release product table (edit this)
team/members.json                       team roster (edit this)
images/                                 downloaded imagery plus images/CREDITS.md
scripts/update_pubs.py                  the script the weekly Action runs
.github/workflows/update-pubs.yml       the weekly Action definition
TODO.md                                 everything still pending on the site
```

## Getting help

For anything beyond editing the files listed above (page layout, new sections, styling
changes), contact Seiji Fujimoto, who set up this site.
