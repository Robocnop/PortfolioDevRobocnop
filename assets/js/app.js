// assets/js/app.js
// ————————————————————————————————————————————
// Utilitaires DOM
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

console.log('[app] loaded');

// 1) Année dynamique (footer)
const yearNode = $('#year');
if (yearNode) yearNode.textContent = new Date().getFullYear();

// 2) Scroll-reveal (IntersectionObserver)
const revealables = $$('.reveal');
if ('IntersectionObserver' in window && revealables.length) {
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealables.forEach((el) => revealer.observe(el));
}

// 3) Scroll-spy (lien actif dans la nav)
const navLinks = $$('a[data-nav]');
const sections = navLinks.map(a => {
  const target = $(a.getAttribute('href'));
  return target && target.id ? target : null;
}).filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = '#' + e.target.id;
        navLinks.forEach(a => a.removeAttribute('aria-current'));
        const active = navLinks.find(a => a.getAttribute('href') === id);
        if (active) active.setAttribute('aria-current', 'page');
      }
    });
  }, { threshold: 0.5, rootMargin: '0px 0px -40% 0px' });
  sections.forEach((s) => spy.observe(s));
}

// 4) Filtres de projets (par tag, via data-tags sur .card)
const grid = $('#project-grid');
const cards = grid ? $$('.card', grid) : [];
const filterButtons = $$('.chip');

function applyFilter(tag) {
  cards.forEach(card => {
    const tags = (card.getAttribute('data-tags') || '').split(',').map(s => s.trim());
    const visible = tag === 'all' || tags.includes(tag);
    card.style.display = visible ? '' : 'none';
  });
}

if (cards.length && filterButtons.length) {
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyFilter(btn.dataset.filter);
    });
  });
}

// 5) Copie rapide d’email (avec feedback ARIA)
const copyBtn = $('#copy-mail');
const feedback = $('#copy-feedback');
if (copyBtn && feedback && navigator.clipboard) {
  copyBtn.addEventListener('click', async () => {
    const email = copyBtn.dataset.mail || '';
    try {
      await navigator.clipboard.writeText(email);
      feedback.textContent = 'Email copié dans le presse-papiers.';
      if (!prefersReduced && feedback.animate) {
        feedback.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      }
      setTimeout(() => (feedback.textContent = ''), 2500);
    } catch {
      // Fallback : affiche l’email si l’API Clipboard n’est pas dispo
      feedback.textContent = email;
    }
  });
}

// 6) Thème : auto/dark/light + persistance
const THEME_KEY = 'theme';

// Applique "auto" (suivre l’OS) en retirant l’attribut data-theme
function setTheme(mode) { // 'light' | 'dark' | 'auto'
  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme'); // media query CSS pilote
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }
  localStorage.setItem(THEME_KEY, mode);
}

// Init du thème au chargement
const themeToggle = $('#theme-toggle');
const cycle = ['auto', 'dark', 'light'];

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'auto';
  setTheme(saved);
  if (themeToggle) themeToggle.title = 'Thème: ' + saved;

  // Réagir au changement système si on est en "auto"
  try {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', () => {
      if ((localStorage.getItem(THEME_KEY) || 'auto') === 'auto') {
        setTheme('auto');
      }
    });
  } catch { /* anciens navigateurs */ }
})();

// Gestion du bouton de cycle de thème
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const cur = localStorage.getItem(THEME_KEY) || 'auto';
    const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
    setTheme(next);
    themeToggle.title = 'Thème: ' + next;
  });
}

// Activer tous les boutons [data-copy] (contact Email/Discord)
(function(){
  const btns = document.querySelectorAll('button[data-copy]');
  if (!btns.length || !navigator.clipboard) return;
  const fb = document.getElementById('copy-feedback');
  btns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(val);
        if (fb) {
          fb.textContent = 'Copié : ' + val;
          setTimeout(() => (fb.textContent = ''), 2000);
        }
      } catch {}
    });
  });
})();