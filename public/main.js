/* ═══════════════════════════════════════════════════════════════
   GABODEV PORTFOLIO — main.js
   Light mode default | Dark mode toggle | MongoDB portfolio fix
═══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   THEME TOGGLE — light default, persist in localStorage
══════════════════════════════════════════════════ */
const html       = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = document.getElementById('theme-icon');
const heroLogo    = document.getElementById('hero-logo-img');

const LOGO_LIGHT = 'img/negro.png';       // logo oscuro sobre fondo claro
const LOGO_DARK  = 'img/logo blanco.png'; // logo claro sobre fondo oscuro

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('gabodev-theme', theme);

  if (theme === 'dark') {
    if (themeIcon)  themeIcon.className = 'fa-solid fa-sun';
    if (heroLogo)   heroLogo.src = LOGO_DARK;
  } else {
    if (themeIcon)  themeIcon.className = 'fa-solid fa-moon';
    if (heroLogo)   heroLogo.src = LOGO_LIGHT;
  }
}

// Init: prefer saved theme, default = light
const savedTheme = localStorage.getItem('gabodev-theme') || 'light';
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

/* ══════════════════════════════════════════════════
   NAVIGATION — scroll + hamburger
══════════════════════════════════════════════════ */
const navbar      = document.getElementById('navbar');
const hamburger   = document.getElementById('hamburger');
const navLinks    = document.getElementById('nav-links');
const allNavLinks = document.querySelectorAll('.nav__link');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  updateActiveNav();
}, { passive: true });

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  navLinks.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  // Lock / unlock body scroll while menu is open
  document.body.style.overflow = open ? 'hidden' : '';
});

// Close menu when a link is clicked
navLinks.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Close menu when user starts scrolling
window.addEventListener('scroll', () => {
  if (hamburger.classList.contains('open')) {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}, { passive: true });

function updateActiveNav() {
  const sections = ['inicio', 'sobre', 'portafolio', 'servicios', 'contacto'];
  const scrollY  = window.scrollY + 130;
  let current    = 'inicio';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollY) current = id;
  });
  allNavLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

/* ══════════════════════════════════════════════════
   HERO: stat counters
══════════════════════════════════════════════════ */
function animateCounter(el) {
  const target   = parseInt(el.dataset.count, 10);
  const duration = 1800;
  const start    = performance.now();
  const step = ts => {
    const p    = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.floor(ease * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target + (target >= 40 ? '+' : '');
  };
  requestAnimationFrame(step);
}

const statNums  = document.querySelectorAll('.stat__num:not(#stat-projects)');
let statsDone   = false;
const statsObs  = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !statsDone) {
    statsDone = true;
    statNums.forEach(n => animateCounter(n));
    // If projects count already loaded, animate it now
    if (window._projectsTotal !== undefined) {
      animateProjectsStat(window._projectsTotal);
    } else {
      window._statsVisible = true;
    }
  }
}, { threshold: .5 });
if (statNums.length) statsObs.observe(statNums[0]);

/* ══════════════════════════════════════════════════
   SKILL BARS
══════════════════════════════════════════════════ */
const skillFills = document.querySelectorAll('.skill-bar__fill');
const skillObs   = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('animated');
      skillObs.unobserve(e.target);
    }
  });
}, { threshold: .25 });
skillFills.forEach(f => skillObs.observe(f));

/* ══════════════════════════════════════════════════
   REVEAL (static elements)
══════════════════════════════════════════════════ */
const staticRevealSel = [
  '.service-card',
  '.dossier__card',
  '.about__bio',
  '.bio__section',
  '.contact__terminal',
  '.contact__form',
];
const staticReveals = document.querySelectorAll(staticRevealSel.join(','));
staticReveals.forEach(el => el.classList.add('reveal'));

const revealObs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 75);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: .1 });
staticReveals.forEach(el => revealObs.observe(el));

/* ══════════════════════════════════════════════════
   HERO PARALLAX — logo moves slightly with mouse
══════════════════════════════════════════════════ */
const heroLogoWrap = document.querySelector('.hero__logo-wrap');
if (heroLogoWrap) {
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - .5) * 14;
    const y = (e.clientY / window.innerHeight - .5) * 8;
    heroLogoWrap.style.transform = `translate(${x * -0.35}px, ${y * -0.25}px)`;
  }, { passive: true });
}

/* ══════════════════════════════════════════════════
   TARGETING RETICLE
══════════════════════════════════════════════════ */
const reticle = document.getElementById('target-reticle');
if (reticle) {
  document.addEventListener('mousemove', e => {
    const heroSec = document.getElementById('inicio');
    if (!heroSec) return;
    if (e.clientY < heroSec.getBoundingClientRect().bottom) {
      reticle.style.left      = e.clientX + 'px';
      reticle.style.top       = e.clientY + 'px';
      reticle.style.transform = 'translate(-50%,-50%) rotate(0deg)';
    }
  }, { passive: true });
}

/* ══════════════════════════════════════════════════
   INK PARALLAX on scroll
══════════════════════════════════════════════════ */
const inkBg = document.querySelector('.ink-bg');
window.addEventListener('scroll', () => {
  if (inkBg) inkBg.style.transform = `translateY(${window.scrollY * 0.12}px)`;
}, { passive: true });

/* ══════════════════════════════════════════════════
   TERMINAL TYPING EFFECT
══════════════════════════════════════════════════ */
const typingEl = document.getElementById('terminal-typing');
if (typingEl) {
  const msgs = [
    'ENVIANDO MENSAJE...',
    'IDENTIFICATE...',
    'CANAL SEGURO...',
    'ENVIA TU MENSAJE...',
  ];
  let mi = 0, ci = 0, deleting = false;
  function typeLoop() {
    const msg = msgs[mi];
    if (!deleting) {
      typingEl.textContent = msg.slice(0, ++ci);
      if (ci === msg.length) { deleting = true; setTimeout(typeLoop, 1800); return; }
    } else {
      typingEl.textContent = msg.slice(0, --ci);
      if (ci === 0) { deleting = false; mi = (mi + 1) % msgs.length; }
    }
    setTimeout(typeLoop, deleting ? 42 : 78);
  }
  typeLoop();
}

/* ══════════════════════════════════════════════════
   DYNAMIC PROJECTS STAT
   Updates the hero counter with the real total from DB
══════════════════════════════════════════════════ */
const statProjects = document.getElementById('stat-projects');

function animateProjectsStat(total) {
  if (!statProjects) return;
  const duration = 1400;
  const from     = parseInt(statProjects.textContent, 10) || 0;
  const start    = performance.now();
  const step = ts => {
    const p    = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 4);
    statProjects.textContent = Math.round(from + (total - from) * ease);
    if (p < 1) requestAnimationFrame(step);
    else statProjects.textContent = total;
  };
  requestAnimationFrame(step);
}

/* Load total project count independently of filter selection.
   Called once on page load; also called after each upload in admin. */
async function loadTotalProjectCount() {
  try {
    const res  = await fetch('/api/projects');
    const data = await res.json();
    if (data.success && Array.isArray(data.projects)) {
      const total = data.projects.length;
      window._projectsTotal = total;
      // Only animate if the stats section is already visible
      if (window._statsVisible) {
        animateProjectsStat(total);
      }
    }
  } catch (e) {
    console.warn('[Stat] Could not load project count', e);
  }
}

loadTotalProjectCount();

/* ══════════════════════════════════════════════════
   PORTFOLIO — fetch from MongoDB API
   Fix: cards use CSS @keyframes (no JS class toggle)
══════════════════════════════════════════════════ */
const portfolioGrid    = document.getElementById('portfolio-grid');
const portfolioLoading = document.getElementById('portfolio-loading');
const portfolioEmpty   = document.getElementById('portfolio-empty');
const filterBtns       = document.querySelectorAll('.filter-btn');

const CAT_ICONS = {
  programming: 'fa-solid fa-code',
  web:         'fa-solid fa-laptop-code',
  design:      'fa-solid fa-pen-ruler',
  video:       'fa-solid fa-clapperboard',
};
const CAT_LABELS = { programming: 'PROGRAMACIÓN', web: 'DESARROLLO WEB', design: 'DISEÑO', video: 'VIDEO' };

async function fetchProjects(category = 'all') {
  // Show loader, clear old cards
  portfolioLoading.style.display = 'block';
  portfolioEmpty.classList.add('hidden');
  document.querySelectorAll('.project-card').forEach(c => c.remove());

  try {
    const url = category === 'all'
      ? '/api/projects'
      : `/api/projects?category=${encodeURIComponent(category)}`;

    const res = await fetch(url);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    portfolioLoading.style.display = 'none';

    if (!data.success || !data.projects || !data.projects.length) {
      portfolioEmpty.classList.remove('hidden');
      return;
    }

    // Render cards — animation handled by CSS @keyframes cardAppear
    data.projects.forEach((p, i) => {
      const card = buildCard(p, i);
      portfolioGrid.appendChild(card);
    });

  } catch (err) {
    console.error('[Portfolio] Error fetching projects:', err);
    portfolioLoading.style.display = 'none';
    portfolioEmpty.classList.remove('hidden');
  }
}

function buildCard(p, index) {
  const card = document.createElement('article');
  card.className = 'project-card';
  // stagger animation delay via CSS custom property
  card.style.animationDelay = `${index * 80}ms`;

  const mediaHtml = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${escHtml(p.title)}" loading="lazy"/>`
    : `<div class="project-card__media-placeholder"><i class="${CAT_ICONS[p.category] || 'fa-solid fa-image'}"></i></div>`;

  const tagsHtml = (p.tags || [])
    .map(t => `<span class="project-card__tag">${escHtml(t)}</span>`)
    .join('');

  card.innerHTML = `
    <div class="project-card__media">
      ${mediaHtml}
      <div class="project-card__overlay">
        <i class="project-card__overlay-icon fa-solid fa-expand"></i>
      </div>
    </div>
    <div class="project-card__body">
      <span class="project-card__cat mono">${CAT_LABELS[p.category] || p.category.toUpperCase()}</span>
      <h3 class="project-card__title">${escHtml(p.title)}</h3>
      <p class="project-card__desc">${escHtml(p.description || '')}</p>
      ${tagsHtml ? `<div class="project-card__tags">${tagsHtml}</div>` : ''}
    </div>
    <div class="project-card__border" aria-hidden="true"></div>
  `;

  card.addEventListener('click', () => openModal(p));
  return card;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    fetchProjects(btn.dataset.filter);
  });
});

// Initial load
fetchProjects();

/* ══════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════ */
const modal      = document.getElementById('project-modal');
const modalClose = document.getElementById('modal-close');
const modalBack  = document.getElementById('modal-backdrop');
const modalMedia = document.getElementById('modal-media');
const modalCat   = document.getElementById('modal-category');
const modalTitle = document.getElementById('modal-title');
const modalDesc  = document.getElementById('modal-desc');
const modalTags  = document.getElementById('modal-tags');
const modalLink  = document.getElementById('modal-link');
const modalGithub= document.getElementById('modal-github');

function openModal(p) {
  modalCat.textContent   = CAT_LABELS[p.category] || p.category;
  modalTitle.textContent = p.title;
  modalDesc.textContent  = p.description || '';
  modalTags.innerHTML    = (p.tags || []).map(t => `<span>${escHtml(t)}</span>`).join('');

  if (p.link) { modalLink.href = p.link; modalLink.style.display = 'inline-flex'; }
  else         { modalLink.style.display = 'none'; }

  if (p.githubUrl) { modalGithub.href = p.githubUrl; modalGithub.style.display = 'inline-flex'; }
  else             { modalGithub.style.display = 'none'; }

  if (p.videoUrl) {
    // Detectar si es un link de YouTube y convertirlo a embed
    const ytMatch = p.videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (ytMatch) {
      const videoId = ytMatch[1];
      modalMedia.innerHTML = `
        <div style="position:relative;width:100%;padding-bottom:56.25%;background:#000">
          <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
            style="position:absolute;inset:0;width:100%;height:100%;border:none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>`;
    } else {
      // Video nativo (no YouTube)
      modalMedia.innerHTML = `<video src="${p.videoUrl}" controls autoplay muted loop style="width:100%;max-height:400px;display:block"></video>`;
    }
  } else if (p.imageUrl) {
    modalMedia.innerHTML = `<img src="${p.imageUrl}" alt="${escHtml(p.title)}" style="width:100%;max-height:500px;object-fit:contain;display:block;background:var(--bg-alt)"/>`;
  } else {
    const icon = CAT_ICONS[p.category] || 'fa-solid fa-image';
    modalMedia.innerHTML = `<div style="height:100px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:#555"><i class="${icon}"></i></div>`;
  }

  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  modalMedia.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
modalBack.addEventListener('click',  closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ══════════════════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════════════════ */
const contactForm = document.getElementById('contact-form');
const formStatus  = document.getElementById('form-status');
const btnSend     = document.getElementById('btn-send');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    btnSend.disabled  = true;
    btnSend.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Enviando...</span>';
    formStatus.textContent = '';
    formStatus.className   = 'form-status';

    await new Promise(r => setTimeout(r, 900));

    formStatus.textContent = '> MENSAJE ENVIADO EXITOSAMENTE. TE RESPONDERÉ A LA BREVEDAD.';
    formStatus.className   = 'form-status success';
    contactForm.reset();
    btnSend.disabled  = false;
    btnSend.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Enviar Mensaje</span><span class="btn__glitch" aria-hidden="true"></span>';
  });
}

/* ══════════════════════════════════════════════════
   PAGE FADE IN
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity    = '0';
  document.body.style.transition = 'opacity .45s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });
});
