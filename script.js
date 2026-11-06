/* ==============================
   script.js – DEMTH403 Question Bank
   ============================== */

(function () {
  'use strict';

  /* ── DOM refs ── */
  const searchInput  = document.getElementById('searchInput');
  const searchClear  = document.getElementById('searchClear');
  const filterChips  = document.querySelectorAll('.chip');
  const allCards     = document.querySelectorAll('.q-card');
  const allSections  = document.querySelectorAll('.unit-section');
  const noResults    = document.getElementById('noResults');
  const backToTop    = document.getElementById('backToTop');
  const navItems     = document.querySelectorAll('.nav-item');
  const totalQCount  = document.getElementById('totalQCount');

  /* ── State ── */
  let activeFilter = 'all';
  let searchQuery  = '';

  /* ─────────────────────────────────────────
     COUNT & DISPLAY TOTAL
  ───────────────────────────────────────── */
  totalQCount.textContent = allCards.length;

  /* ─────────────────────────────────────────
     UNIT QUESTION COUNTS
  ───────────────────────────────────────── */
  allSections.forEach(section => {
    const id = section.id;                          // e.g. "unit1"
    const countEl = document.getElementById('count-' + id);
    if (!countEl) return;
    const n = section.querySelectorAll('.q-card').length;
    countEl.textContent = n + ' Q' + (n !== 1 ? 's' : '');
  });

  /* ─────────────────────────────────────────
     FILTER + SEARCH LOGIC
  ───────────────────────────────────────── */
  function applyFilters() {
    const q = searchQuery.toLowerCase().trim();
    let anyVisible = false;

    allCards.forEach(card => {
      const paperAttr  = card.dataset.paper || '';   // e.g. "p1 p3"
      const bodyText   = card.textContent.toLowerCase();

      /* paper filter */
      const paperMatch =
        activeFilter === 'all' ||
        paperAttr.split(' ').includes(activeFilter);

      /* search filter */
      const searchMatch = q === '' || bodyText.includes(q);

      if (paperMatch && searchMatch) {
        card.classList.remove('hidden');
        anyVisible = true;
      } else {
        card.classList.add('hidden');
      }
    });

    /* show/hide unit sections based on visible cards */
    allSections.forEach(section => {
      const visibleCards = section.querySelectorAll('.q-card:not(.hidden)');
      if (visibleCards.length === 0) {
        section.classList.add('hidden');
      } else {
        section.classList.remove('hidden');
      }
    });

    noResults.classList.toggle('hidden', anyVisible);

    /* a filter can hide the active unit's section — re-pick the highlight */
    if (typeof updateActiveNav === 'function') updateActiveNav();
  }

  /* ─────────────────────────────────────────
     SEARCH INPUT
  ───────────────────────────────────────── */
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    searchClear.classList.toggle('visible', searchQuery.length > 0);
    applyFilters();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.remove('visible');
    searchInput.focus();
    applyFilters();
  });

  /* ─────────────────────────────────────────
     FILTER CHIPS
  ───────────────────────────────────────── */
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      applyFilters();
    });
  });

  /* ─────────────────────────────────────────
     ACTIVE NAV HIGHLIGHT ON SCROLL
     Fixed 2026-11-06: the old IntersectionObserver
     (threshold 0.2, rootMargin '-80px 0px -60% 0px')
     went stale after fast scrolling / back-to-top —
     it showed Unit 2 while Unit 1 or Unit 4 was on
     screen, and only settled at the very bottom.
     This replaces it with a deterministic check:
     the active unit is the last visible section
     whose top is at or above the anchor line
     (120px down, just below the sticky header).
     At the very top that is the first unit, so the
     highlight can never stick on a stale unit.
     Hidden sections (filtered out) are skipped.
  ───────────────────────────────────────── */
  function updateActiveNav() {
    const anchor = window.scrollY + 120;
    let current = null;
    allSections.forEach(section => {
      if (section.classList.contains('hidden')) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= anchor) current = section.id;
    });
    if (!current) {
      const first = Array.from(allSections).find(s => !s.classList.contains('hidden'));
      if (first) current = first.id;
    }
    navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('href') === '#' + current);
    });
  }

  let navTicking = false;
  function onScrollNav() {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => { updateActiveNav(); navTicking = false; });
  }

  window.addEventListener('scroll', onScrollNav, { passive: true });
  window.addEventListener('resize', onScrollNav);
  updateActiveNav();

  /* ─────────────────────────────────────────
     BACK TO TOP BUTTON
  ───────────────────────────────────────── */
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ─────────────────────────────────────────
     SMOOTH CARD ENTRANCE ANIMATION
     (stagger cards within each section)
  ───────────────────────────────────────── */
  const cardObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          cardObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 }
  );

  allCards.forEach((card, i) => {
    card.style.animationDelay = (i % 10) * 0.04 + 's';
    card.style.animation = 'cardIn 0.35s ease both paused';
    cardObserver.observe(card);
  });

  /* inject card animation keyframes */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  /* ─────────────────────────────────────────
     KEYBOARD SHORTCUT: "/" → focus search
  ───────────────────────────────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.blur();
    }
  });

  /* ─────────────────────────────────────────
     INITIAL RENDER
  ───────────────────────────────────────── */
  applyFilters();

})();

  // Hamburger: collapse/expand the units sidebar on mobile
  const navToggle = document.getElementById('navToggle');
  const sidebarEl = document.getElementById('sidebar');
  if (navToggle && sidebarEl) {
    navToggle.addEventListener('click', () => {
      const open = sidebarEl.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.textContent = open ? '\u2715' : '\u2630';
    });
    document.querySelectorAll('.nav-item').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          sidebarEl.classList.remove('open');
          navToggle.textContent = '\u2630';
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
