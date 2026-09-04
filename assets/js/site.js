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

  function fetchJson(url) {
    return fetch(url).then(function (res) {
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
        ? authors.slice(0, 8).join(", ") + ", et al."
        : authors.join(", ");
      var fullAuthors = authors.join(", ");

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
        escapeHtml(p.title || "Untitled") +
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
            '<tr><td colspan="7">No products listed yet.</td></tr>';
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
  function initTeam() {
    var grid = document.getElementById("team-grid");
    if (!grid) return;

    var MEMBERS_URL = "team/members.json";

    fetchJson(MEMBERS_URL)
      .then(function (data) {
        var members = Array.isArray(data) ? data : data.members || [];
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
              escapeHtml(m.name) +
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
  /* Init on DOM ready                                                   */
  /* ------------------------------------------------------------------ */
  function init() {
    initNavToggle();
    initPublications();
    initDataProducts();
    initTeam();
    initCopyButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
