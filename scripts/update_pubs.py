#!/usr/bin/env python3
"""
scripts/update_pubs.py

Maintained, stdlib-only script (Python 3.9+ compatible, no third-party imports)
that keeps pubs/pubs.json in sync with the curated bibcode list in
pubs/bibcodes.txt, and surfaces possible new GLIMPSE papers for human review
in pubs/candidates.json.

What it does
------------
1. Reads pubs/bibcodes.txt (one ADS bibcode per line, '#' starts a comment,
   and inline trailing comments after a bibcode are also stripped).
2. Obtains an ADS API token: uses the ADS_API_TOKEN environment variable if
   set, otherwise requests an anonymous bootstrap token from
   https://ui.adsabs.harvard.edu/v1/accounts/bootstrap.
3. Queries https://api.adsabs.harvard.edu/v1/search/query for exactly those
   bibcodes, requesting fl=bibcode,title,author,year,pub,volume,page,doi,
   identifier,date,doctype,citation_count.
4. Converts the results into the shape assets/js/site.js expects and writes
   pubs/pubs.json, but ONLY if the content actually changed, so the GitHub
   Action that runs this script weekly does not create empty commits.
5. Runs a second, discovery query:
       full:"GLIMPSE" full:"Abell S1063" year:2024-2030
   and writes any bibcode found there that is NOT already present in
   bibcodes.txt to pubs/candidates.json, for a human to review.

Why candidates are never auto-promoted
---------------------------------------
"GLIMPSE" is not a unique search term. It collides with the Spitzer/IRAC
GLIMPSE Galactic plane survey (a completely different, much older program)
and with the ordinary English word "glimpse", so a full-text search on that
term alone returns a lot of noise. pubs/bibcodes.txt, maintained by hand, is
the single authoritative list of GLIMPSE (JWST GO 3293) publications. This
script only ever appends candidate bibcodes to pubs/candidates.json for a
person to check and, if genuine, add to bibcodes.txt themselves. It never
writes a candidate into bibcodes.txt or pubs.json automatically.

Usage
-----
    python3 scripts/update_pubs.py

Exit status is 0 on success, including the case where nothing changed.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BIBCODES_PATH = REPO_ROOT / "pubs" / "bibcodes.txt"
PUBS_JSON_PATH = REPO_ROOT / "pubs" / "pubs.json"
CANDIDATES_JSON_PATH = REPO_ROOT / "pubs" / "candidates.json"

ADS_BOOTSTRAP_URL = "https://ui.adsabs.harvard.edu/v1/accounts/bootstrap"
ADS_SEARCH_URL = "https://api.adsabs.harvard.edu/v1/search/query"
SEARCH_FIELDS = "bibcode,title,author,year,pub,volume,page,doi,identifier,date,doctype,citation_count"
DISCOVERY_QUERY = 'full:"GLIMPSE" full:"Abell S1063" year:2024-2030'


def read_bibcodes(path):
    """Read one ADS bibcode per line. '#' starts a comment, whether the whole
    line or trailing after the bibcode. Blank lines are ignored."""
    bibcodes = []
    if not path.exists():
        return bibcodes
    with open(path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.split("#", 1)[0].strip()
            if not line:
                continue
            bibcodes.append(line)
    return bibcodes


def get_ads_token():
    """Return an ADS API token: ADS_API_TOKEN env var if set, else request
    an anonymous bootstrap token."""
    env_token = os.environ.get("ADS_API_TOKEN")
    if env_token:
        return env_token

    req = urllib.request.Request(ADS_BOOTSTRAP_URL, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            token = payload.get("access_token")
            if not token:
                raise RuntimeError("Bootstrap response did not include access_token")
            return token
    except urllib.error.URLError as exc:
        raise RuntimeError("Could not obtain an anonymous ADS bootstrap token: {}".format(exc))


def ads_query(token, params):
    """Run one query against the ADS search endpoint. params is a dict of
    query-string parameters (q, fl, rows, ...)."""
    query_string = urllib.parse.urlencode(params)
    url = "{}?{}".format(ADS_SEARCH_URL, query_string)
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", "Bearer {}".format(token))
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_records_for_bibcodes(token, bibcodes):
    """Query ADS for exactly the given bibcodes."""
    if not bibcodes:
        return []
    quoted = " OR ".join('bibcode:"{}"'.format(b) for b in bibcodes)
    params = {
        "q": quoted,
        "fl": SEARCH_FIELDS,
        "rows": str(max(len(bibcodes), 1)),
    }
    result = ads_query(token, params)
    return result.get("response", {}).get("docs", [])


def fetch_discovery_candidates(token, known_bibcodes):
    """Run the discovery query and return bibcodes not already known."""
    params = {
        "q": DISCOVERY_QUERY,
        "fl": "bibcode,title",
        "rows": "200",
    }
    result = ads_query(token, params)
    docs = result.get("response", {}).get("docs", [])
    known = set(known_bibcodes)
    candidates = []
    for doc in docs:
        bibcode = doc.get("bibcode")
        if bibcode and bibcode not in known:
            candidates.append({"bibcode": bibcode, "title": (doc.get("title") or [None])[0]})
    return candidates


def doctype_status(doctype):
    return "Refereed" if doctype == "article" else "Preprint"


def extract_arxiv_id(identifiers):
    if not identifiers:
        return None
    for ident in identifiers:
        if ident.startswith("arXiv:"):
            return ident.split("arXiv:", 1)[1]
    return None


def record_to_pub(doc):
    bibcode = doc.get("bibcode")
    doctype = doc.get("doctype")
    doi_list = doc.get("doi") or []
    doi = doi_list[0] if doi_list else None
    arxiv_id = extract_arxiv_id(doc.get("identifier"))

    pub = doc.get("pub")
    volume = doc.get("volume")
    page = doc.get("page")
    if isinstance(page, list):
        page = page[0] if page else None
    parts = [p for p in [pub, volume, page] if p]
    journal_ref = ", ".join(str(p) for p in parts) if parts else (pub or "")

    status = doctype_status(doctype)
    arxiv_url = "https://arxiv.org/abs/{}".format(arxiv_id) if arxiv_id else None
    ads_url = "https://ui.adsabs.harvard.edu/abs/{}".format(bibcode) if bibcode else None
    doi_url = "https://doi.org/{}".format(doi) if (status == "Refereed" and doi) else None

    return {
        "bibcode": bibcode,
        "title": (doc.get("title") or [""])[0],
        "authors": doc.get("author") or [],
        "year": doc.get("year"),
        "journal": pub,
        "journal_ref": journal_ref,
        "status": status,
        "arxiv_url": arxiv_url,
        "ads_url": ads_url,
        "doi_url": doi_url,
        "citations": doc.get("citation_count"),
    }


def write_json_if_changed(path, data):
    """Write data as pretty JSON, but only if it differs from what is
    already on disk. Returns True if the file was written."""
    new_content = json.dumps(data, indent=2) + "\n"
    if path.exists():
        old_content = path.read_text(encoding="utf-8")
        if old_content == new_content:
            return False
    path.write_text(new_content, encoding="utf-8")
    return True


def main():
    bibcodes = read_bibcodes(BIBCODES_PATH)
    if not bibcodes:
        print("No bibcodes found in {}. Nothing to do.".format(BIBCODES_PATH))
        return 0

    try:
        token = get_ads_token()
    except RuntimeError as exc:
        print("ERROR: {}".format(exc), file=sys.stderr)
        return 1

    try:
        docs = fetch_records_for_bibcodes(token, bibcodes)
    except (urllib.error.URLError, ValueError) as exc:
        print("ERROR: ADS query for known bibcodes failed: {}".format(exc), file=sys.stderr)
        return 1

    pubs = [record_to_pub(doc) for doc in docs]
    pubs.sort(key=lambda p: (p.get("year") or "", p.get("bibcode") or ""), reverse=True)

    pubs_changed = write_json_if_changed(PUBS_JSON_PATH, pubs)

    try:
        candidates = fetch_discovery_candidates(token, bibcodes)
    except (urllib.error.URLError, ValueError) as exc:
        print("WARNING: discovery query failed, leaving candidates.json untouched: {}".format(exc), file=sys.stderr)
        candidates = None

    candidates_changed = False
    if candidates is not None:
        candidates_payload = {
            "generated": None,
            "candidates": candidates,
        }
        candidates_changed = write_json_if_changed(CANDIDATES_JSON_PATH, candidates_payload)

    print("GLIMPSE publication update summary")
    print("  bibcodes read from bibcodes.txt: {}".format(len(bibcodes)))
    print("  records returned by ADS:         {}".format(len(docs)))
    print("  pubs.json changed:               {}".format(pubs_changed))
    if candidates is not None:
        print("  discovery candidates found:      {}".format(len(candidates)))
        print("  candidates.json changed:         {}".format(candidates_changed))
    else:
        print("  discovery candidates found:      (query failed, see warning above)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
