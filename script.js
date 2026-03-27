/* ============================================================
   LUMIÈRE EVENTS — script.js
   Features:
   · Smooth scroll with custom easing
   · Navbar: scroll-state + active-link tracking
   · Mobile hamburger menu toggle
   · Image slider with auto-advance, dots, keyboard & touch
   · Scroll-reveal animations (IntersectionObserver)
   · Service card staggered reveal
   · Contact form validation with live feedback
   ============================================================ */

'use strict';

/* ── Utility helpers ──────────────────────────────────────── */

/**
 * Eased smooth scroll to a target element.
 * @param {HTMLElement} target
 * @param {number} duration - ms
 */
function smoothScrollTo(target, duration = 900) {
  const navH   = parseInt(getComputedStyle(document.documentElement)
                   .getPropertyValue('--nav-h')) || 72;
  const start  = window.scrollY;
  const end    = target.getBoundingClientRect().top + start - navH;
  const change = end - start;
  let startTime = null;

  // Ease-in-out cubic
  function ease(t) {
    return t < 0.5
      ? 4 * t * t * t
      : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + change * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ── Navbar: scroll state ─────────────────────────────────── */
const navbar = document.getElementById('navbar');

function handleNavbarScroll() {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleNavbarScroll, { passive: true });
handleNavbarScroll(); // run once on load

/* ── Navbar: active link on scroll ───────────────────────── */
const sections   = document.querySelectorAll('section[id]');
const navLinks   = document.querySelectorAll('.nav-link');

function updateActiveLink() {
  const scrollPos = window.scrollY + 120; // offset for nav height + buffer
  let currentId = '';

  sections.forEach(section => {
    if (scrollPos >= section.offsetTop) {
      currentId = section.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.toggle(
      'active',
      link.getAttribute('href') === '#' + currentId
    );
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink();

/* ── Smooth scroll: all anchor links ─────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    smoothScrollTo(target, 900);

    // Close mobile menu if open
    closeMobileMenu();
  });
});

/* ── Mobile hamburger menu ────────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function openMobileMenu() {
  hamburger.classList.add('open');
  mobileMenu.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden'; // prevent background scroll
}

function closeMobileMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('open');
  isOpen ? closeMobileMenu() : openMobileMenu();
});

// Close on outside click
document.addEventListener('click', e => {
  if (
    mobileMenu.classList.contains('open') &&
    !mobileMenu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    closeMobileMenu();
  }
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    closeMobileMenu();
    hamburger.focus();
  }
});

/* ── Image Slider ─────────────────────────────────────────── */
(function initSlider() {
  const track    = document.getElementById('sliderTrack');
  const prevBtn  = document.getElementById('sliderPrev');
  const nextBtn  = document.getElementById('sliderNext');
  const dotsWrap = document.getElementById('sliderDots');

  if (!track) return;

  const slides = track.querySelectorAll('.slide');
  const total  = slides.length;
  let current  = 0;
  let autoTimer = null;

  /* Build dots */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.classList.add('dot');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = dotsWrap.querySelectorAll('.dot');

  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(index) {
    current = (index + total) % total;       // wrap around
    track.style.transform = `translateX(-${current * 100}%)`;
    updateDots();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  nextBtn.addEventListener('click', () => { resetAuto(); next(); });
  prevBtn.addEventListener('click', () => { resetAuto(); prev(); });

  /* Keyboard navigation when slider is in viewport */
  document.addEventListener('keydown', e => {
    const sliderSection = document.getElementById('gallery');
    const rect = sliderSection.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowRight') { resetAuto(); next(); }
    if (e.key === 'ArrowLeft')  { resetAuto(); prev(); }
  });

  /* Touch / swipe support */
  let touchStartX = null;

  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const delta = touchStartX - e.changedTouches[0].clientX;

    if (Math.abs(delta) > 50) {
      resetAuto();
      delta > 0 ? next() : prev();
    }
    touchStartX = null;
  }, { passive: true });

  /* Auto-advance every 5 s */
  function startAuto() {
    autoTimer = setInterval(next, 5000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  /* Pause when tab is hidden */
  document.addEventListener('visibilitychange', () => {
    document.hidden ? clearInterval(autoTimer) : startAuto();
  });

  /* Init */
  goTo(0);
  startAuto();
})();

/* ── Scroll-reveal via IntersectionObserver ──────────────── */
(function initReveal() {
  // Generic [data-reveal] elements
  const revealEls = document.querySelectorAll(
    '.section-header, .about-copy, .about-visuals, ' +
    '.contact-info, .contact-form-wrap, ' +
    '.footer-top'
  );

  revealEls.forEach(el => el.setAttribute('data-reveal', ''));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));
})();

/* ── Service card staggered entrance via CSS animation ────── */
(function initServiceCards() {
  // Cards are always visible (opacity:1 in CSS).
  // We add a lightweight CSS keyframe entrance triggered by a class,
  // applied in sequence using the data-delay attribute.
  const cards = document.querySelectorAll('.service-card');

  cards.forEach(card => {
    const delay = parseInt(card.dataset.delay) || 0;
    // Temporarily set so the animation starts after the delay
    card.style.animationDelay = delay + 'ms';
    card.classList.add('card-animate');
  });
})();

/* ── Contact form validation ─────────────────────────────── */
(function initContactForm() {
  const form       = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn  = document.getElementById('submitBtn');
  const successEl  = document.getElementById('formSuccess');

  /* Field references */
  const fields = {
    name:    { el: document.getElementById('name'),    err: document.getElementById('nameError') },
    email:   { el: document.getElementById('email'),   err: document.getElementById('emailError') },
    event:   { el: document.getElementById('event'),   err: document.getElementById('eventError') },
    message: { el: document.getElementById('message'), err: document.getElementById('messageError') },
  };

  /* Validators */
  const validators = {
    name (val) {
      if (!val.trim()) return 'Please enter your full name.';
      if (val.trim().length < 2) return 'Name must be at least 2 characters.';
      return '';
    },
    email (val) {
      if (!val.trim()) return 'Please enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address.';
      return '';
    },
    event (val) {
      if (!val) return 'Please select an event type.';
      return '';
    },
    message (val) {
      if (!val.trim()) return 'Please enter your message.';
      if (val.trim().length < 20) return 'Message must be at least 20 characters.';
      return '';
    },
  };

  /* Show/clear error for a single field */
  function setError(key, msg) {
    const { el, err } = fields[key];
    const group = el.closest('.form-group');
    err.textContent = msg;
    group.classList.toggle('error', !!msg);
  }

  /* Validate a single field and return true if valid */
  function validateField(key) {
    const val = fields[key].el.value;
    const msg = validators[key](val);
    setError(key, msg);
    return !msg;
  }

  /* Live validation on blur */
  Object.keys(fields).forEach(key => {
    fields[key].el.addEventListener('blur', () => validateField(key));
    fields[key].el.addEventListener('input', () => {
      // Clear error as user types after a failed submission
      if (fields[key].el.closest('.form-group').classList.contains('error')) {
        validateField(key);
      }
    });
  });

  /* Form submit */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validate all fields
    const valid = Object.keys(fields).map(validateField).every(Boolean);

    if (!valid) {
      // Focus the first errored field
      const firstError = form.querySelector('.form-group.error input, .form-group.error select, .form-group.error textarea');
      if (firstError) firstError.focus();
      return;
    }

    /* Simulate async submission */
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    setTimeout(() => {
      // Show success
      form.reset();
      successEl.classList.add('visible');
      submitBtn.textContent = 'Send Enquiry';
      submitBtn.disabled = false;

      // Hide success after 6 s
      setTimeout(() => successEl.classList.remove('visible'), 6000);
    }, 1400);
  });
})();

/* ── Stats counter animation ─────────────────────────────── */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-num');
  if (!stats.length) return;

  function countUp(el) {
    const rawText = el.textContent.trim();           // e.g. "850+", "98%", "12"
    const suffix  = rawText.replace(/[\d]/g, '');    // "+", "%", ""
    const target  = parseInt(rawText.replace(/\D/g, ''), 10);
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        countUp(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
})();