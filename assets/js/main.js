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
