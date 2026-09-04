/* GLIMPSE site.js
   Vanilla JS, no dependencies. Every module below no-ops if its target
   element is not present on the current page, so this single file can be
   included on every page. Fetch paths are relative so the site works when
   served from a subpath. */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Mobile nav toggle                                                   */
  /* ------------------------------------------------------------------ */
  function initNavToggle() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("open", !expanded);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Shared helpers                                                      */
  /* ------------------------------------------------------------------ */
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function tbdPill() {
    return '<span class="tbd">TBD</span>';
  }

  /* ------------------------------------------------------------------ */
  /* Title rendering: ADS titles carry <SUP>/<SUB> markup and inline     */
  /* LaTeX math ($...$) that must not be printed raw.                    */
  /* ------------------------------------------------------------------ */
  function renderMath(expr) {
    var s = expr;

    /* Text-mode switches: keep the enclosed text, drop the macro. */
    s = s.replace(/\\mathrm\{([^{}]*)\}/g, "$1");
    s = s.replace(/\\rm(?![a-zA-Z])/g, "");

    /* Superscript / subscript: a braced group, a macro run, or one char. */
    s = s.replace(/\^(\{[^{}]*\}|\\[a-zA-Z]+|[^\s{}_^$])/g, function (m, g) {
      return "<sup>" + (g.charAt(0) === "{" ? g.slice(1, -1) : g) + "</sup>";
    });
    s = s.replace(/_(\{[^{}]*\}|\\[a-zA-Z]+|[^\s{}_^$])/g, function (m, g) {
      return "<sub>" + (g.charAt(0) === "{" ? g.slice(1, -1) : g) + "</sub>";
    });

    /* Common macros to Unicode. Longest keys first so e.g. \simeq is
       replaced before \sim. */
    var MACROS = {
      "\\simeq": "≃",
      "\\approx": "≈",
      "\\times": "×",
      "\\alpha": "α",
      "\\gamma": "γ",
      "\\delta": "δ",
      "\\sigma": "σ",
      "\\lambda": "λ",
      "\\star": "*",
      "\\odot": "☉",
      "\\sim": "~",
      "\\beta": "β",
      "\\mu": "μ",
      "\\pm": "±",
      "\\AA": "Å"
    };
    Object.keys(MACROS)
      .sort(function (a, b) {
        return b.length - a.length;
      })
      .forEach(function (key) {
        s = s.split(key).join(MACROS[key]);
      });

    /* Thin-space macros. */
    s = s.replace(/\\[,;!]/g, " ");

    /* Any remaining backslash-macro is unrecognized: strip it, don't
       print it raw. */
    s = s.replace(/\\[a-zA-Z]+/g, "");
    s = s.replace(/\\/g, "");

    return s;
  }

  function renderTitle(raw) {
    var s = escapeHtml(raw);

    /* Restore ADS <SUP>/<SUB> markup (now HTML-escaped) to real elements. */
    s = s.replace(/&lt;sup&gt;([\s\S]*?)&lt;\/sup&gt;/gi, "<sup>$1</sup>");
    s = s.replace(/&lt;sub&gt;([\s\S]*?)&lt;\/sub&gt;/gi, "<sub>$1</sub>");

    /* Convert inline LaTeX math delimited by a single pair of $. */
    s = s.replace(/\$([^$]+)\$/g, function (m, inner) {
      return renderMath(inner);
    });

    /* ADS represents a dash as "--". Convert both the space-delimited form
       (LEGGOS Survey -- LEnsing) and the numeric-range form (4.5--10.1) to an
       en-dash. Never introduce an em-dash. */
    s = s.replace(/ -- /g, " – ");
    s = s.replace(/(\w|\d)--(\w|\d)/g, "$1–$2");

    return s;
  }

  function fetchJson(url) {
    /* no-store so an edit to a data file shows up straight away rather than
       sitting behind the GitHub Pages CDN cache for ten minutes. */
    return fetch(url, { cache: "no-store" }).then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status + " for " + url);
      }
      return res.json();
    });
  }

  function showFetchError(container, url, err) {
    container.innerHTML =
      '<p class="pub-empty">Could not load data from <code>' +
      escapeHtml(url) +
      "</code>. (" +
      escapeHtml(err && err.message ? err.message : String(err)) +
      ")</p>";
  }

  /* ------------------------------------------------------------------ */
  /* Publications renderer                                               */
  /* ------------------------------------------------------------------ */
  function initPublications() {
    var container = document.getElementById("pub-list");
    if (!container) return;

    var searchBox = document.getElementById("pub-search");
    var refereedToggle = document.getElementById("pub-refereed-only");
    var countEl = document.getElementById("pub-count");

    var PUBS_URL = "pubs/pubs.json";

    fetchJson(PUBS_URL)
      .then(function (data) {
        var entries = Array.isArray(data) ? data : data.publications || [];
        if (countEl) {
          countEl.textContent = String(entries.length);
        }
        renderPubs(entries);

        function applyFilters() {
          var q = (searchBox && searchBox.value ? searchBox.value : "")
            .trim()
            .toLowerCase();
          var refereedOnly = !!(refereedToggle && refereedToggle.checked);

          var filtered = entries.filter(function (p) {
            if (refereedOnly && p.status !== "Refereed") return false;
            if (!q) return true;
            var haystack = (
              (p.title || "") +
              " " +
              (p.authors || []).join(" ") +
              " " +
              (p.journal || "") +
              " " +
              (p.year || "")
            ).toLowerCase();
            return haystack.indexOf(q) !== -1;
          });
          renderPubs(filtered);
        }

        if (searchBox) searchBox.addEventListener("input", applyFilters);
        if (refereedToggle)
          refereedToggle.addEventListener("change", applyFilters);
      })
      .catch(function (err) {
        showFetchError(container, PUBS_URL, err);
      });

    function statusPillClass(status) {
      if (status === "Refereed") return "pill-refereed";
      if (status === "Preprint") return "pill-preprint";
      return "pill-inprep";
    }

    function renderPubs(entries) {
      if (!entries.length) {
        container.innerHTML = '<p class="pub-empty">No publications match.</p>';
        return;
      }

      var byYear = {};
      entries.forEach(function (p) {
        var y = p.year || "Unknown";
        if (!byYear[y]) byYear[y] = [];
        byYear[y].push(p);
      });

      var years = Object.keys(byYear).sort(function (a, b) {
        return b.localeCompare(a, undefined, { numeric: true });
      });

      var html = "";
      years.forEach(function (year) {
        html += '<h3 class="pub-year-heading">' + escapeHtml(year) + "</h3>";
        byYear[year].forEach(function (p, i) {
          html += renderPubRow(p, year + "-" + i);
        });
      });

      container.innerHTML = html;

      /* per-entry "show all authors" toggles */
      container.querySelectorAll(".pub-show-all").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-target");
          var full = document.getElementById(id);
          if (!full) return;
          var isHidden = full.hasAttribute("hidden");
          if (isHidden) {
            full.removeAttribute("hidden");
            btn.previousElementSibling &&
              btn.previousElementSibling.setAttribute("hidden", "");
            btn.textContent = "show fewer authors";
          } else {
            full.setAttribute("hidden", "");
            btn.previousElementSibling &&
              btn.previousElementSibling.removeAttribute("hidden");
            btn.textContent = "show all authors";
          }
        });
      });
    }

    function renderPubRow(p, rowId) {
      var authors = p.authors || [];
      var truncated = authors.length > 8;
      var shortAuthors = truncated
        ? authors.slice(0, 8).join("; ") + "; et al."
        : authors.join("; ");
      var fullAuthors = authors.join("; ");

      var titleUrl = p.doi_url || p.arxiv_url || p.ads_url || "#";
      var statusLabel = p.status || "Preprint";

      var authorsHtml;
      if (truncated) {
        var shortId = "authors-short-" + rowId;
        var fullId = "authors-full-" + rowId;
        authorsHtml =
          '<span id="' +
          shortId +
          '">' +
          escapeHtml(shortAuthors) +
          "</span>" +
          '<span id="' +
          fullId +
          '" hidden>' +
          escapeHtml(fullAuthors) +
          "</span>" +
          " " +
          '<button type="button" class="pub-show-all" data-target="' +
          fullId +
          '">show all authors</button>';
      } else {
        authorsHtml = escapeHtml(shortAuthors);
      }

      var links = [];
      if (p.arxiv_url) {
        links.push('<a href="' + escapeHtml(p.arxiv_url) + '">arXiv</a>');
      }
      if (p.ads_url) {
        links.push('<a href="' + escapeHtml(p.ads_url) + '">ADS</a>');
      }

      return (
        '<article class="pub-row">' +
        '<h4 class="pub-title"><a href="' +
        escapeHtml(titleUrl) +
        '">' +
        renderTitle(p.title || "Untitled") +
        "</a></h4>" +
        '<p class="pub-authors">' +
        authorsHtml +
        "</p>" +
        '<p class="pub-meta">' +
        escapeHtml(p.journal_ref || p.journal || "") +
        ' <span class="pill ' +
        statusPillClass(statusLabel) +
        '">' +
        escapeHtml(statusLabel) +
        "</span></p>" +
        '<p class="pub-links">' +
        links.join("") +
        "</p>" +
        "</article>"
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* Data products renderer                                             */
  /* ------------------------------------------------------------------ */
  function initDataProducts() {
    var tbody = document.getElementById("data-products-body");
    if (!tbody) return;

    var PRODUCTS_URL = "data/products.json";

    fetchJson(PRODUCTS_URL)
      .then(function (data) {
        var products = Array.isArray(data) ? data : data.products || [];
        if (!products.length) {
          tbody.innerHTML =
            '<tr><td colspan="8">No products listed yet.</td></tr>';
          return;
        }
        tbody.innerHTML = products
          .map(function (p) {
            return (
              "<tr>" +
              "<td>" +
              escapeHtml(p.name) +
              "</td>" +
              "<td>" +
              escapeHtml(p.description) +
              "</td>" +
              "<td>" +
              (p.format ? escapeHtml(p.format) : tbdPill()) +
              "</td>" +
              "<td>" +
              (p.version ? escapeHtml(p.version) : tbdPill()) +
              "</td>" +
              "<td>" +
              (p.size ? escapeHtml(p.size) : tbdPill()) +
              "</td>" +
              "<td>" +
              (p.url
                ? '<a href="' + escapeHtml(p.url) + '">Download</a>'
                : tbdPill()) +
              "</td>" +
              "<td>" +
              escapeHtml(p.notes || "") +
              "</td>" +
              "<td>" +
              escapeHtml(p.source || "") +
              "</td>" +
              "</tr>"
            );
          })
          .join("");
      })
      .catch(function (err) {
        showFetchError(tbody.closest("table") || tbody, PRODUCTS_URL, err);
      });
  }

  /* ------------------------------------------------------------------ */
  /* Team renderer                                                       */
  /* ------------------------------------------------------------------ */
  function displayName(name) {
    var str = String(name || "");
    var idx = str.indexOf(", ");
    if (idx === -1) return str;
    return str.slice(idx + 2) + " " + str.slice(0, idx);
  }

  function initTeam() {
    var grid = document.getElementById("team-grid");
    if (!grid) return;

    var MEMBERS_URL = "team/members.json";

    fetchJson(MEMBERS_URL)
      .then(function (data) {
        var allMembers = Array.isArray(data) ? data : data.members || [];
        /* Co-PIs already appear in the Leadership cards above; skip them
           here so they are not shown twice. */
        var members = allMembers.filter(function (m) {
          return !m.role;
        });
        if (!members.length) {
          grid.innerHTML = '<p class="pub-empty">No team members listed.</p>';
          return;
        }
        grid.innerHTML = members
          .map(function (m) {
            var roleHtml = m.role
              ? '<div class="team-role">' + escapeHtml(m.role) + "</div>"
              : "";
            var instHtml = m.institution
              ? '<div class="team-inst">' + escapeHtml(m.institution) + "</div>"
              : "";
            return (
              '<div class="team-card">' +
              '<div class="team-name">' +
              escapeHtml(displayName(m.name)) +
              "</div>" +
              roleHtml +
              instHtml +
              "</div>"
            );
          })
          .join("");
      })
      .catch(function (err) {
        showFetchError(grid, MEMBERS_URL, err);
      });
  }

  /* ------------------------------------------------------------------ */
  /* Copy-to-clipboard buttons                                          */
  /* ------------------------------------------------------------------ */
  function initCopyButtons() {
    var buttons = document.querySelectorAll("[data-copy-target]");
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.getAttribute("data-copy-target");
        var target = document.getElementById(targetId);
        if (!target) return;
        var text = target.innerText || target.textContent || "";

        function confirmCopied() {
          var original = btn.textContent;
          btn.textContent = "Copied";
          btn.classList.add("copied");
          setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove("copied");
          }, 1500);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(confirmCopied, function () {
            fallbackCopy(text, confirmCopied);
          });
        } else {
          fallbackCopy(text, confirmCopied);
        }
      });
    });

    function fallbackCopy(text, done) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        /* clipboard not available: no-op */
      }
      document.body.removeChild(ta);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lightbox for zoomable figures                                       */
  /*                                                                     */
  /* Any <button class="zoom-trigger"> wrapping an <img> opens that image */
  /* full size. The caption comes from data-caption, the full-resolution  */
  /* link from data-source. Nothing here runs on pages with no triggers.  */
  /* ------------------------------------------------------------------ */
  function initLightbox() {
    var triggers = document.querySelectorAll(".zoom-trigger");
    if (!triggers.length) return;

    var lastFocused = null;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Enlarged image");
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close enlarged image">' +
      "Close</button>" +
      '<figure class="lightbox-figure">' +
      '<img class="lightbox-img" alt="">' +
      '<figcaption class="lightbox-caption"></figcaption>' +
      "</figure>";
    document.body.appendChild(box);

    var img = box.querySelector(".lightbox-img");
    var caption = box.querySelector(".lightbox-caption");
    var closeBtn = box.querySelector(".lightbox-close");

    function open(trigger) {
      var source = trigger.querySelector("img");
      if (!source) return;
      lastFocused = trigger;
      img.src = source.currentSrc || source.src;
      img.alt = source.alt || "";

      var text = trigger.getAttribute("data-caption") || source.alt || "";
      var href = trigger.getAttribute("data-source");
      caption.textContent = text;
      if (href) {
        var link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Full resolution and image release";
        caption.appendChild(document.createElement("br"));
        caption.appendChild(link);
      }

      box.hidden = false;
      document.body.classList.add("has-lightbox");
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove("has-lightbox");
      img.removeAttribute("src");
      caption.textContent = "";
      if (lastFocused) lastFocused.focus();
      lastFocused = null;
    }

    Array.prototype.forEach.call(triggers, function (trigger) {
      trigger.addEventListener("click", function () {
        open(trigger);
      });
    });

    closeBtn.addEventListener("click", close);

    /* Clicking the backdrop closes; clicking the image itself does not. */
    box.addEventListener("click", function (event) {
      if (event.target === box || event.target === box.querySelector(".lightbox-figure")) {
        close();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (box.hidden) return;
      if (event.key === "Escape") {
        close();
      } else if (event.key === "Tab") {
        /* Only the close button is focusable while open, so keep focus there. */
        event.preventDefault();
        closeBtn.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Init on DOM ready                                                   */
  /* ------------------------------------------------------------------ */
  function init() {
    initNavToggle();
    initPublications();
    initDataProducts();
    initTeam();
    initCopyButtons();
    initLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
