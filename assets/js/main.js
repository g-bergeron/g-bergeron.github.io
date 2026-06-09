// ════════════════════════════════════════
// Dark mode
// ════════════════════════════════════════
(function () {
  var html   = document.documentElement;
  var btn    = document.getElementById('themeToggle');
  var DARK   = 'dark';
  var KEY    = 'theme';

  // Restore saved preference (or system default) on every page load
  var saved  = localStorage.getItem(KEY);
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = saved ? saved === DARK : prefersDark;

  if (isDark) html.setAttribute('data-theme', DARK);

  if (btn) {
    btn.addEventListener('click', function () {
      var currentlyDark = html.getAttribute('data-theme') === DARK;
      if (currentlyDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem(KEY, 'light');
      } else {
        html.setAttribute('data-theme', DARK);
        localStorage.setItem(KEY, DARK);
      }
    });
  }
})();


// ════════════════════════════════════════
// Navbar: scroll shadow
// ════════════════════════════════════════
(function () {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


// ════════════════════════════════════════
// Hamburger / Mobile menu
// ════════════════════════════════════════
(function () {
  var btn  = document.querySelector('.hamburger');
  var menu = document.getElementById('mobile-menu');
  var body = document.body;
  if (!btn || !menu) return;

  function openMenu() {
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
  }

  function closeMenu() {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
  }

  btn.addEventListener('click', function () {
    btn.classList.contains('open') ? closeMenu() : openMenu();
  });

  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.classList.contains('open')) closeMenu();
  });
})();


// ════════════════════════════════════════
// Active nav link (IntersectionObserver)
// ════════════════════════════════════════
(function () {
  var sections = document.querySelectorAll('section[id]');
  var links    = document.querySelectorAll('.nav-links ol li a');
  if (!sections.length || !links.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.getAttribute('id');
        links.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(function (s) { observer.observe(s); });
})();


// ════════════════════════════════════════
// Fade-in on scroll
// ════════════════════════════════════════
(function () {
  var targets = document.querySelectorAll(
    '.project-card, .timeline-item, .featured-project'
  );

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.style.opacity = '1'; });
    return;
  }

  targets.forEach(function (el) {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
  });

  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'none';
        reveal.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });

  targets.forEach(function (el) { reveal.observe(el); });
})();


// ════════════════════════════════════════
// CV download links (fetched from GitHub Releases API)
// The fetch is fired immediately so it runs in parallel with page load.
// Once both the fetch settles and the DOM is ready, all [data-cv-link]
// anchors get the resolved href — or are greyed out on error/timeout.
// ════════════════════════════════════════
(function () {
  var API_URL  = 'https://api.github.com/repos/mesabloo/academic-cv/releases/latest';
  var ASSET    = 'resume.pdf';
  var TIMEOUT  = 5000;

  // Fire the network request immediately (parallel to page rendering).
  var fetchPromise = new Promise(function (resolve, reject) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
      reject(new Error('timeout'));
    }, TIMEOUT);

    fetch(API_URL, controller ? { signal: controller.signal } : {})
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) { reject(new Error('http ' + res.status)); return; }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        var assets = data.assets || [];
        for (var i = 0; i < assets.length; i++) {
          if (assets[i].name === ASSET) {
            resolve(assets[i].browser_download_url);
            return;
          }
        }
        reject(new Error('asset not found'));
      })
      .catch(function (err) {
        clearTimeout(timer);
        reject(err);
      });
  });

  function applyToCvLinks(url) {
    document.querySelectorAll('[data-cv-link]').forEach(function (el) {
      if (url) {
        el.href = url;
      } else {
        el.removeAttribute('href');
        el.classList.add('cv-unavailable');
      }
    });
  }

  // Wait for the DOM, then apply whatever the fetch returned.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      fetchPromise.then(function (url) { applyToCvLinks(url); })
                  .catch(function ()    { applyToCvLinks(null); });
    });
  } else {
    fetchPromise.then(function (url) { applyToCvLinks(url); })
                .catch(function ()    { applyToCvLinks(null); });
  }
})();


// ════════════════════════════════════════
// Socialify dark/light theme swap
// Updates the ?theme= param on .fp-socialify images whenever
// the colour scheme changes.
// ════════════════════════════════════════
(function () {
  function updateSocialifyTheme() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var theme  = isDark ? 'Dark' : 'Light';
    document.querySelectorAll('img.fp-socialify').forEach(function (img) {
      var repo = img.getAttribute('data-repo');
      if (!repo) return;
      img.src = 'https://socialify.git.ci/' + repo +
        '/image?font=KoHo&forks=1&issues=1&language=1&name=1&pattern=Circuit+Board&pulls=1&stargazers=1&theme=' + theme;
    });
  }

  // Run on load and whenever the toggle fires
  updateSocialifyTheme();

  var toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      // Small delay to let the data-theme attribute flip first
      setTimeout(updateSocialifyTheme, 50);
    });
  }
})();


// ════════════════════════════════════════
// Publications / Talks: search + filter
// + accordion + pagination
// ════════════════════════════════════════
(function () {
  var PER_PAGE_DEFAULT = 5;

  function initSection(opts) {
    var searchEl    = document.getElementById(opts.searchId);
    var filterBar   = document.getElementById(opts.filterId);
    var listEl      = document.getElementById(opts.listId);
    var paginationEl = document.getElementById(opts.paginationId);
    if (!listEl) return;

    var allItems     = Array.prototype.slice.call(listEl.children);
    var activeFilters = [];
    var query        = '';
    var page         = 0;
    var perPage      = PER_PAGE_DEFAULT;

    // ── Accordion toggle ──
    listEl.addEventListener('click', function (e) {
      var summary = e.target.closest('.pub-summary, .talk-summary');
      if (!summary) return;
      // Don't toggle when clicking a link inside the title
      if (e.target.closest('a')) return;
      var item = summary.parentElement;
      if (item) item.classList.toggle('open');
    });

    // ── Filtering ──
    function getVisible() {
      return allItems.filter(function (item) {
        var cats = (item.getAttribute('data-categories') || '').split(' ');
        var catOk = activeFilters.length === 0 || activeFilters.some(function (f) {
          return cats.indexOf(f) !== -1;
        });
        var text = (item.getAttribute('data-search-text') || '').toLowerCase();
        var qOk  = !query || text.indexOf(query) !== -1;
        return catOk && qOk;
      });
    }

    // ── Render ──
    function render() {
      var visible = getVisible();
      var total   = visible.length;
      var pages   = Math.max(1, Math.ceil(total / perPage));
      if (page >= pages) page = 0;

      allItems.forEach(function (item) { item.style.display = 'none'; });
      visible.slice(page * perPage, (page + 1) * perPage).forEach(function (item) {
        item.style.display = '';
      });

      renderPagination(total, pages);
    }

    function renderPagination(total, pages) {
      if (!paginationEl) return;
      if (total === 0) {
        paginationEl.innerHTML = '<p class="list-empty">No items match.</p>';
        return;
      }

      var start = page * perPage + 1;
      var end   = Math.min((page + 1) * perPage, total);

      var pageNums = '';
      for (var i = 0; i < pages; i++) {
        pageNums += '<button type="button" class="pagination-btn' + (i === page ? ' active' : '') +
          '" data-page="' + i + '">' + (i + 1) + '</button>';
      }

      var perPageOptions = [3, 5, 10].map(function (n) {
        return '<option value="' + n + '"' + (perPage === n ? ' selected' : '') + '>' + n + '</option>';
      }).join('');

      paginationEl.innerHTML =
        '<span class="pagination-info">' + start + '–' + end + ' of ' + total + '</span>' +
        '<div class="pagination-buttons">' +
          '<button type="button" class="pagination-btn" data-page="' + (page - 1) + '"' + (page === 0 ? ' disabled' : '') + '>← Prev</button>' +
          pageNums +
          '<button type="button" class="pagination-btn" data-page="' + (page + 1) + '"' + (page >= pages - 1 ? ' disabled' : '') + '>Next →</button>' +
        '</div>' +
        '<div class="pagination-per-page">' +
          '<span>per page</span>' +
          '<select data-per-page>' + perPageOptions + '</select>' +
        '</div>';
    }

    // ── Pagination clicks ──
    if (paginationEl) {
      paginationEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.pagination-btn');
        if (!btn || btn.disabled) return;
        var p = parseInt(btn.getAttribute('data-page'), 10);
        if (!isNaN(p)) { page = p; render(); }
      });

      paginationEl.addEventListener('change', function (e) {
        if (e.target.hasAttribute('data-per-page')) {
          perPage = parseInt(e.target.value, 10);
          page = 0;
          render();
        }
      });
    }

    // ── Search ──
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        query = searchEl.value.trim().toLowerCase();
        page  = 0;
        render();
      });
    }

    // ── Filter bar ──
    if (filterBar) {
      filterBar.addEventListener('click', function (e) {
        var btn   = e.target.closest('.cat-filter');
        var clear = e.target.closest('.cat-filter-clear');
        if (clear) {
          activeFilters = [];
          filterBar.querySelectorAll('.cat-filter').forEach(function (b) { b.classList.remove('active'); });
        } else if (btn) {
          var cat = btn.getAttribute('data-category');
          var idx = activeFilters.indexOf(cat);
          if (idx === -1) { activeFilters.push(cat); btn.classList.add('active'); }
          else            { activeFilters.splice(idx, 1); btn.classList.remove('active'); }
        } else {
          return;
        }
        page = 0;
        render();
      });
    }

    render();
  }

  initSection({ searchId: 'pub-search',  filterId: 'pub-filter-bar',  listId: 'pub-list',  paginationId: 'pub-pagination'  });
  initSection({ searchId: 'talk-search', filterId: 'talk-filter-bar', listId: 'talk-list', paginationId: 'talk-pagination' });
})();
