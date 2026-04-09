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
   · Social media links open in new tabs (fixed)
   · MOBILE MENU LINKS NOW WORK PROPERLY
   ============================================================ */

'use strict';

/* ── Utility helpers ──────────────────────────────────────── */

function smoothScrollTo(target, duration = 900) {
  const navH = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-h')) || 72;
  const start = window.scrollY;
  const end = target.getBoundingClientRect().top + start - navH;
  const change = end - start;
  let startTime = null;

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
handleNavbarScroll();

/* ── Navbar: active link on scroll ───────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveLink() {
  const scrollPos = window.scrollY + 120;
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

/* ── Smooth scroll: ALL anchor links (including mobile) ─────── */
// This handles BOTH desktop and mobile menu links
function handleAnchorClick(e) {
  const anchor = e.currentTarget;
  const href = anchor.getAttribute('href');
  
  // Skip if it's just "#" or empty
  if (!href || href === '#') return;
  
  // Skip external links (those that start with http:// or https://)
  if (href.startsWith('http://') || href.startsWith('https://')) return;
  
  const target = document.querySelector(href);
  if (!target) return;
  
  e.preventDefault();
  smoothScrollTo(target, 900);
  
  // Close mobile menu after clicking
  closeMobileMenu();
}

// Apply to ALL anchor tags with href starting with #
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  // Remove any existing listeners to avoid duplicates
  anchor.removeEventListener('click', handleAnchorClick);
  anchor.addEventListener('click', handleAnchorClick);
});

/* ── Mobile hamburger menu ────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function openMobileMenu() {
  hamburger.classList.add('open');
  mobileMenu.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

if (hamburger && mobileMenu) {
  // Toggle menu on hamburger click
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileMenu.classList.contains('open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMobileMenu();
      if (hamburger) hamburger.focus();
    }
  });
}

/* ── Image Slider (fixed) ─────────────────────────────────── */
(function initSlider() {
  const track = document.getElementById('sliderTrack');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  const dotsWrap = document.getElementById('sliderDots');

  if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

  const slides = track.querySelectorAll('.slide');
  const total = slides.length;
  let current = 0;
  let autoTimer = null;

  // Build dots
  dotsWrap.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.classList.add('dot');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  }

  const dots = dotsWrap.querySelectorAll('.dot');

  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    updateDots();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  nextBtn.addEventListener('click', () => { resetAuto(); next(); });
  prevBtn.addEventListener('click', () => { resetAuto(); prev(); });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    const sliderSection = document.getElementById('gallery');
    if (!sliderSection) return;
    const rect = sliderSection.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowRight') { resetAuto(); next(); }
    if (e.key === 'ArrowLeft') { resetAuto(); prev(); }
  });

  // Touch swipe support
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

  // Auto-advance
  function startAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(next, 5000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    document.hidden ? clearInterval(autoTimer) : startAuto();
  });

  goTo(0);
  startAuto();
})();

/* ── Scroll-reveal via IntersectionObserver ──────────────── */
(function initReveal() {
  const revealEls = document.querySelectorAll(
    '.section-header, .about-copy, .about-visuals, ' +
    '.contact-info, .contact-form-wrap, .footer-top'
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

/* ── Service card entrance animation ────────────────────── */
(function initServiceCards() {
  const cards = document.querySelectorAll('.service-card');
  cards.forEach(card => {
    card.classList.add('card-animate');
  });
})();

/* ── Contact form validation ─────────────────────────────── */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const successEl = document.getElementById('formSuccess');

  const fields = {
    name: { el: document.getElementById('name'), err: document.getElementById('nameError') },
    email: { el: document.getElementById('email'), err: document.getElementById('emailError') },
    event: { el: document.getElementById('event'), err: document.getElementById('eventError') },
    message: { el: document.getElementById('message'), err: document.getElementById('messageError') },
  };

  const validators = {
    name(val) {
      if (!val.trim()) return 'Please enter your full name.';
      if (val.trim().length < 2) return 'Name must be at least 2 characters.';
      return '';
    },
    email(val) {
      if (!val.trim()) return 'Please enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address.';
      return '';
    },
    event(val) {
      if (!val) return 'Please select an event type.';
      return '';
    },
    message(val) {
      if (!val.trim()) return 'Please enter your message.';
      if (val.trim().length < 20) return 'Message must be at least 20 characters.';
      return '';
    },
  };

  function setError(key, msg) {
    const { el, err } = fields[key];
    if (!el || !err) return;
    const group = el.closest('.form-group');
    err.textContent = msg;
    if (group) group.classList.toggle('error', !!msg);
  }

  function validateField(key) {
    const field = fields[key];
    if (!field || !field.el) return true;
    const val = field.el.value;
    const msg = validators[key](val);
    setError(key, msg);
    return !msg;
  }

  // Live validation
  Object.keys(fields).forEach(key => {
    const field = fields[key];
    if (!field || !field.el) return;
    field.el.addEventListener('blur', () => validateField(key));
    field.el.addEventListener('input', () => {
      if (field.el.closest('.form-group')?.classList.contains('error')) {
        validateField(key);
      }
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const valid = Object.keys(fields).map(validateField).every(Boolean);
    if (!valid) {
      const firstError = form.querySelector('.form-group.error input, .form-group.error select, .form-group.error textarea');
      if (firstError) firstError.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;
    }
    if (successEl) successEl.classList.remove('visible');

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        form.reset();
        Object.keys(fields).forEach(key => setError(key, ''));
        if (successEl) {
          successEl.classList.add('visible');
          setTimeout(() => successEl.classList.remove('visible'), 7000);
        }
      } else {
        showFormError('Something went wrong. Please try again or email us directly.');
      }
    } catch (err) {
      showFormError('Network error — please check your connection and try again.');
    } finally {
      if (submitBtn) {
        submitBtn.textContent = 'Send Enquiry';
        submitBtn.disabled = false;
      }
    }
  });

  function showFormError(msg) {
    if (!successEl) return;
    successEl.textContent = '⚠ ' + msg;
    successEl.style.background = 'rgba(192,57,43,0.12)';
    successEl.style.borderColor = '#c0392b';
    successEl.style.color = '#e74c3c';
    successEl.classList.add('visible');
    setTimeout(() => {
      successEl.classList.remove('visible');
      successEl.textContent = '✦ Thank you! We\'ll be in touch within 24 hours.';
      successEl.style.background = '';
      successEl.style.borderColor = '';
      successEl.style.color = '';
    }, 7000);
  }
})();

/* ── Stats counter animation ─────────────────────────────── */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-num');
  if (!stats.length) return;

  function countUp(el) {
    const rawText = el.textContent.trim();
    const suffix = rawText.replace(/[\d]/g, '');
    const target = parseInt(rawText.replace(/\D/g, ''), 10);
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
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

// Log to confirm script is working
console.log('Lumière Events — All systems operational!');
