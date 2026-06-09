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


// ════════════════════════════════════════
// Cat logo: random expression on load + re-randomize + scroll on click
// ════════════════════════════════════════
(function () {
  var MOUTH = '<path fill-rule="evenodd" clip-rule="evenodd" d="M12.0196 14.9374C11.7284 14.9374 11.4307 14.9818 11.1784 15.0796C11.0546 15.1275 10.9032 15.2031 10.7699 15.3252C10.6361 15.4479 10.4632 15.6749 10.4632 15.9999C10.4632 16.3249 10.6361 16.5519 10.7699 16.6745C10.9032 16.7967 11.0546 16.8722 11.1784 16.9202C11.4307 17.018 11.7284 17.0624 12.0196 17.0624C12.3109 17.0624 12.6085 17.018 12.8609 16.9202C12.9846 16.8722 13.136 16.7967 13.2693 16.6745C13.4032 16.5519 13.5761 16.3249 13.5761 15.9999C13.5761 15.6749 13.4032 15.4479 13.2693 15.3252C13.136 15.2031 12.9846 15.1275 12.8609 15.0796C12.6085 14.9818 12.3109 14.9374 12.0196 14.9374Z"/>';

  var BODY = '<path fill-rule="evenodd" clip-rule="evenodd" d="M6.09485 4.25C5.48148 4.25 4.77463 4.42871 4.20882 4.91616C3.62226 5.4215 3.27004 6.18781 3.27004 7.1875V9.0625L3.27005 9.06545C3.2712 9.35941 3.3211 9.94757 3.4888 10.4392C3.54365 10.6001 3.63129 10.8134 3.77764 11.0058C3.49364 11.5688 3.35904 12.1495 3.29787 12.7095C3.2468 13.1771 3.24611 13.6679 3.25424 14.1211C2.5932 14.3507 1.90877 14.6349 1.5932 14.8387C1.24524 15.0634 1.14534 15.5277 1.37006 15.8756C1.59478 16.2236 2.05903 16.3235 2.40698 16.0988C2.5234 16.0236 2.86686 15.8664 3.31867 15.6939C3.38755 16.173 3.52716 16.6095 3.7221 17.0063C3.56621 17.1035 3.42847 17.1935 3.31889 17.2652C3.27694 17.2926 3.23912 17.3173 3.20599 17.3387C2.85803 17.5634 2.75813 18.0277 2.98285 18.3756C3.20757 18.7236 3.67182 18.8235 4.01978 18.5988C4.0609 18.5722 4.10473 18.5436 4.15098 18.5134C4.28216 18.4278 4.43287 18.3294 4.59701 18.2288C5.18653 18.8313 5.91865 19.2964 6.67916 19.6462C8.45998 20.4654 10.569 20.75 12.0001 20.75C13.4311 20.75 15.5402 20.4654 17.321 19.6462C18.0815 19.2964 18.8136 18.8313 19.4031 18.2288C19.5673 18.3294 19.718 18.4278 19.8491 18.5134C19.8954 18.5436 19.9392 18.5722 19.9803 18.5988C20.3283 18.8235 20.7925 18.7236 21.0173 18.3756C21.242 18.0277 21.1421 17.5634 20.7941 17.3387C20.761 17.3173 20.7232 17.2926 20.6812 17.2652C20.5716 17.1935 20.4339 17.1035 20.2781 17.0063C20.473 16.6095 20.6127 16.173 20.6815 15.6938C21.1335 15.8663 21.4771 16.0236 21.5936 16.0988C21.9415 16.3235 22.4058 16.2236 22.6305 15.8756C22.8552 15.5277 22.7553 15.0634 22.4074 14.8387C22.0917 14.6349 21.4071 14.3506 20.7459 14.121C20.7541 13.6678 20.7534 13.177 20.7023 12.7095C20.6412 12.1495 20.5065 11.5688 20.2225 11.0058C20.3689 10.8134 20.4565 10.6001 20.5114 10.4392C20.6791 9.94758 20.729 9.35941 20.7301 9.06545L20.7302 9.0625V7.18761C20.7302 6.18792 20.3779 5.42162 19.7914 4.91628C19.2256 4.42882 18.5187 4.25011 17.9054 4.25011C17.4969 4.25011 17.0744 4.40685 16.7337 4.56076C16.3726 4.72392 15.9952 4.9359 15.6558 5.13136C15.5828 5.17339 15.5119 5.21444 15.443 5.25432L15.441 5.25548C15.177 5.4084 14.9427 5.5441 14.7339 5.65167C14.6042 5.7185 14.5035 5.7643 14.4285 5.79206C14.3969 5.80377 14.3767 5.80966 14.3663 5.81242C14.1129 5.81102 13.9514 5.79033 13.7181 5.76044C13.6681 5.75403 13.6147 5.74719 13.5564 5.74003C13.2098 5.69743 12.7722 5.65636 12.0001 5.65636C11.228 5.65636 10.7905 5.69743 10.4438 5.74003C10.3855 5.74719 10.3322 5.75403 10.2821 5.76044C10.0489 5.79033 9.88738 5.81102 9.63388 5.81242C9.62352 5.80966 9.60332 5.80376 9.57174 5.79206C9.49678 5.7643 9.39604 5.71849 9.26633 5.65166C9.05755 5.54408 8.82331 5.40842 8.55926 5.25548C8.48975 5.21523 8.41818 5.17377 8.34446 5.13132C8.00502 4.93584 7.62764 4.72384 7.26652 4.56067C6.92587 4.40675 6.50329 4.25 6.09485 4.25ZM6.16192 17.6138C6.49595 17.8657 6.8808 18.0879 7.30604 18.2835C8.83694 18.9877 10.7179 19.25 12.0001 19.25C13.2823 19.25 15.1632 18.9877 16.6941 18.2835C17.1194 18.0879 17.5042 17.8657 17.8382 17.6138C17.4858 17.5524 17.2179 17.245 17.2179 16.875C17.2179 16.4608 17.5537 16.125 17.9679 16.125C18.2951 16.125 18.6295 16.2068 18.9399 16.3204C19.0985 15.9885 19.1959 15.625 19.2226 15.2271C18.9249 15.1544 18.7193 15.125 18.6134 15.125C18.1992 15.125 17.8634 14.7892 17.8634 14.375C17.8634 13.9608 18.1992 13.625 18.6134 13.625C18.8081 13.625 19.0284 13.6542 19.2504 13.6974C19.2505 13.4213 19.2415 13.1502 19.2112 12.8724C19.1407 12.227 18.958 11.6541 18.5269 11.1447C18.3727 10.9625 18.1809 10.7813 17.9402 10.6045C17.6063 10.3594 17.5344 9.88999 17.7796 9.55611C18.0247 9.22224 18.4941 9.15031 18.828 9.39546C18.9471 9.48292 19.0597 9.57282 19.1659 9.66506C19.2099 9.43686 19.2295 9.19817 19.2302 9.06087V7.18761C19.2302 6.56231 19.0238 6.23486 18.8123 6.0527C18.5801 5.85266 18.2496 5.75011 17.9054 5.75011C17.835 5.75011 17.659 5.78868 17.3513 5.92771C17.064 6.0575 16.7432 6.23612 16.4043 6.43125C16.3407 6.4679 16.2759 6.50544 16.2106 6.54328C15.9428 6.69843 15.666 6.85883 15.4209 6.98509C15.2663 7.06473 15.1052 7.14099 14.9495 7.19867C14.8058 7.25192 14.607 7.3125 14.3941 7.3125C14.0223 7.3125 13.7617 7.27877 13.5115 7.2464C13.4654 7.24043 13.4196 7.23449 13.3735 7.22883C13.0848 7.19336 12.7084 7.15636 12.0001 7.15636C11.2919 7.15636 10.9154 7.19336 10.6267 7.22883C10.5807 7.23449 10.5349 7.24042 10.4887 7.24639C10.2386 7.27877 9.97796 7.3125 9.6061 7.3125C9.39326 7.3125 9.19445 7.25191 9.05069 7.19866C8.89497 7.14098 8.73386 7.06471 8.57928 6.98506C8.33423 6.8588 8.05742 6.69839 7.78968 6.54325C7.72435 6.50539 7.65955 6.46784 7.59589 6.43118C7.25702 6.23603 6.93614 6.05741 6.64888 5.92761C6.34115 5.78856 6.16522 5.75 6.09485 5.75C5.75062 5.75 5.42007 5.85254 5.18787 6.05259C4.97643 6.23475 4.77004 6.56219 4.77004 7.1875V9.06088C4.7707 9.19819 4.79025 9.43686 4.83425 9.66506C4.94053 9.57281 5.05309 9.48292 5.1722 9.39546C5.50608 9.15031 5.97547 9.22224 6.22062 9.55612C6.46577 9.88999 6.39385 10.3594 6.05997 10.6045C5.81926 10.7813 5.62748 10.9625 5.47331 11.1447C5.04223 11.6541 4.85949 12.227 4.789 12.8724C4.75865 13.1502 4.74966 13.4213 4.74975 13.6975C4.97192 13.6543 5.19231 13.625 5.38719 13.625C5.80141 13.625 6.13719 13.9608 6.13719 14.375C6.13719 14.7892 5.80141 15.125 5.38719 15.125C5.28121 15.125 5.07549 15.1544 4.77758 15.2271C4.80434 15.625 4.90168 15.9885 5.06027 16.3203C5.37069 16.2068 5.70504 16.125 6.03224 16.125C6.44646 16.125 6.78224 16.4608 6.78224 16.875C6.78224 17.245 6.51433 17.5524 6.16192 17.6138Z"/>';

  // Eye paths only — mouth and body are constant across all variants.
  // The body path (drawn last) masks everything outside the eye holes,
  // so pupils only show through the holes already cut into the body.
  var EYE_VARIANTS = [
    // 0: original
    '<path d="M14.0365 12.6464C14.2015 12.38 14.5274 12.0625 15.0163 12.0625C15.5051 12.0625 15.831 12.38 15.996 12.6464C16.1681 12.9243 16.2501 13.2612 16.2501 13.5938C16.2501 13.9263 16.1681 14.2632 15.996 14.5411C15.831 14.8075 15.5051 15.125 15.0163 15.125C14.5274 15.125 14.2015 14.8075 14.0365 14.5411C13.8644 14.2632 13.7824 13.9263 13.7824 13.5938C13.7824 13.2612 13.8644 12.9243 14.0365 12.6464Z"/>' +
    '<path d="M9.01634 12.0625C8.52751 12.0625 8.20161 12.38 8.03658 12.6464C7.86445 12.9243 7.78247 13.2612 7.78247 13.5938C7.78247 13.9263 7.86445 14.2632 8.03658 14.5411C8.20161 14.8075 8.52751 15.125 9.01634 15.125C9.50518 15.125 9.83108 14.8075 9.9961 14.5411C10.1682 14.2632 10.2502 13.9263 10.2502 13.5938C10.2502 13.2612 10.1682 12.9243 9.9961 12.6464C9.83108 12.38 9.50518 12.0625 9.01634 12.0625Z"/>',
    // 1: happy ^^ — fills bottom of each hole, leaving a thin arch of background at the top
    '<path d="M7.316 13.444 A1.7 1.85 0 0 1 10.716 13.444 L7.316 13.444 Z"/>' +
    '<path d="M13.316 13.444 A1.7 1.85 0 0 1 16.716 13.444 L13.316 13.444 Z"/>',
    // 2: sleepy — fills top ~55% of each hole, leaving a curved U at the bottom
    '<path d="M7.316 13.794 A1.7 1.85 0 1 0 10.716 13.794 L7.316 13.794 Z"/>' +
    '<path d="M13.316 13.794 A1.7 1.85 0 1 0 16.716 13.794 L13.316 13.794 Z"/>',
    // 3: sad — small elongated ovals rotated ~40° toward the nose
    '<g transform="rotate(40,9.116,13.794)"><path d="M8.396 13.794 a0.72 1.22 0 1 0 1.44 0 a0.72 1.22 0 1 0 -1.44 0 Z"/></g>' +
    '<g transform="rotate(-40,14.916,13.794)"><path d="M14.196 13.794 a0.72 1.22 0 1 0 1.44 0 a0.72 1.22 0 1 0 -1.44 0 Z"/></g>',
    // 4: surprised — large pupils nearly filling the holes
    '<path d="M7.396 13.594 a1.62 1.72 0 1 0 3.24 0 a1.62 1.72 0 1 0 -3.24 0 Z"/>' +
    '<path d="M13.396 13.594 a1.62 1.72 0 1 0 3.24 0 a1.62 1.72 0 1 0 -3.24 0 Z"/>',
    // 5: side glance — smaller pupils shifted toward the right
    '<path d="M8.956 13.594 a0.88 1.15 0 1 0 1.76 0 a0.88 1.15 0 1 0 -1.76 0 Z"/>' +
    '<path d="M14.956 13.594 a0.88 1.15 0 1 0 1.76 0 a0.88 1.15 0 1 0 -1.76 0 Z"/>'
  ];

  function applyRandomCat() {
    var g = document.querySelector('.nav-logo svg #SVGRepo_iconCarrier');
    if (!g) return;
    var eyes = EYE_VARIANTS[Math.floor(Math.random() * EYE_VARIANTS.length)];
    g.innerHTML = MOUTH + eyes + BODY;
  }

  function init() {
    applyRandomCat();
    var logo = document.querySelector('.nav-logo');
    if (!logo) return;
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      applyRandomCat();
      var maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
      window.scrollTo({ top: Math.round(Math.random() * maxScroll), behavior: 'smooth' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
