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
    '.publication-item, .talk-item, .project-card, .timeline-item, .featured-project'
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
// Publications / Talks: category filters
// + horizontally scrolling pane
// ════════════════════════════════════════
(function () {
  var bars = document.querySelectorAll('.cat-filter-bar');
  if (!bars.length) return;

  var MIN_CARD_WIDTH = 240; // px — below 2x this + gap, collapse to a single column

  bars.forEach(function (bar) {
    var trackId = bar.getAttribute('data-target');
    var track = document.getElementById(trackId);
    if (!track) return;

    var pane = track.closest('.scroll-pane');
    var section = bar.parentElement;
    var emptyMsg = section.querySelector('.scroll-empty');
    var dotsWrap = section.querySelector('.scroll-dots');
    var prevBtn = pane.querySelector('.scroll-arrow-prev');
    var nextBtn = pane.querySelector('.scroll-arrow-next');
    var filterBtns = bar.querySelectorAll('.cat-filter');
    var clearBtn = bar.querySelector('.cat-filter-clear');
    var cards = track.children;
    var active = [];

    function visibleCards() {
      return Array.prototype.filter.call(cards, function (c) {
        return c.style.display !== 'none';
      });
    }

    function columnCount() {
      return (track.clientWidth >= MIN_CARD_WIDTH * 2 + 20) ? 2 : 1;
    }

    function applyColumnMode() {
      var cols = columnCount();
      var gap = 20;

      // Fixed pixel card width: avoids percentage-based sizing entirely, so
      // the browser cannot redistribute space across more tracks than intended.
      var cardWidth = (track.clientWidth - gap * (cols - 1)) / cols;
      track.style.setProperty('--card-width', cardWidth + 'px');
    }

    function pageWidth() {
      var v = visibleCards();
      if (!v.length) return track.clientWidth;
      return v[0].getBoundingClientRect().width + 20;
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      var v = visibleCards();
      var perPage = columnCount() * 2;
      var pages = Math.ceil(v.length / perPage);
      dotsWrap.classList.toggle('hidden', pages <= 1);
      for (var i = 0; i < pages; i++) {
        var d = document.createElement('span');
        if (i === 0) d.classList.add('active');
        dotsWrap.appendChild(d);
      }
    }

    function updateDots() {
      var pw = pageWidth() * columnCount();
      var idx = pw ? Math.round(track.scrollLeft / pw) : 0;
      var dots = dotsWrap.children;
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('active', i === idx);
      }
    }

    function updateArrows() {
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      updateDots();
    }

    function applyFilters() {
      var anyVisible = false;
      Array.prototype.forEach.call(cards, function (card) {
        var cats = (card.getAttribute('data-categories') || '').split(' ');
        var match = active.length === 0 || active.every(function (a) {
          return cats.indexOf(a) !== -1;
        });
        card.style.display = match ? 'flex' : 'none';
        if (match) anyVisible = true;
      });

      if (emptyMsg) emptyMsg.hidden = anyVisible;
      pane.style.display = anyVisible ? 'flex' : 'none';

      track.scrollTo({ left: 0 });
      applyColumnMode();
      buildDots();
      updateArrows();
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-category');
        var idx = active.indexOf(cat);
        if (idx === -1) {
          active.push(cat);
          btn.classList.add('active');
        } else {
          active.splice(idx, 1);
          btn.classList.remove('active');
        }
        applyFilters();
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        active = [];
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        applyFilters();
      });
    }

    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -pageWidth() * columnCount(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: pageWidth() * columnCount(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', function () {
      applyColumnMode();
      buildDots();
      updateArrows();
    });

    applyFilters();
  });
})();
