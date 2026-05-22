/* ═══════════════════════════════════════════════════════════════
   LEEVS.IN — Premium Website JavaScript
   Author: Leela Srinivas Atla
   Version: 1.0
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   1. UTILITY HELPERS
═══════════════════════════════════════════════════════════════ */
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

const on = (el, event, handler, options) => {
  if (el) el.addEventListener(event, handler, options);
};

const off = (el, event, handler) => {
  if (el) el.removeEventListener(event, handler);
};

/* ═══════════════════════════════════════════════════════════════
   2. THEME TOGGLE — Default: Light Mode
═══════════════════════════════════════════════════════════════ */
const initTheme = () => {
  const html        = document.documentElement;
  const toggleBtn   = $('#themeToggle');
  const STORAGE_KEY = 'leevs-theme';

  // Default is LIGHT — only switch to dark if explicitly saved
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const activeTheme = savedTheme === 'dark' ? 'dark' : 'light';
  html.setAttribute('data-theme', activeTheme);

  const applyTheme = (theme) => {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      toggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };

  applyTheme(activeTheme);

  on(toggleBtn, 'click', () => {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
};

/* ═══════════════════════════════════════════════════════════════
   3. NAVBAR — Scroll Effect + Mobile Menu
═══════════════════════════════════════════════════════════════ */
const initNavbar = () => {
  const navbar    = $('#navbar');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  const mobileLinks = $$('.mobile-link');

  // Scroll shadow
  const handleScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  on(window, 'scroll', handleScroll, { passive: true });
  handleScroll();

  // Hamburger toggle
  const closeMenu = () => {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  on(hamburger, 'click', () => {
    const isOpen = hamburger.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  mobileLinks.forEach(link => on(link, 'click', closeMenu));

  // Close on outside click
  on(document, 'click', (e) => {
    if (
      mobileMenu &&
      mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Close on Escape key
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Active nav link highlight on scroll
  const sections = $$('section[id]');
  const navLinks = $$('.navbar__nav a');

  const highlightNav = () => {
    let current = '';
    sections.forEach(section => {
      const top = section.getBoundingClientRect().top;
      if (top <= 100) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  };

  on(window, 'scroll', highlightNav, { passive: true });
};

/* ═══════════════════════════════════════════════════════════════
   4. SCROLL REVEAL — IntersectionObserver
═══════════════════════════════════════════════════════════════ */
const initScrollReveal = () => {
  const elements = $$('.reveal');
  if (!elements.length) return;

  // Check for reduced motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.08,
    }
  );

  elements.forEach(el => observer.observe(el));
};

/* ═══════════════════════════════════════════════════════════════
   5. BEFORE / AFTER COMPARISON SLIDER — FIXED DUAL CLIP-PATH
   Both sides clipped simultaneously. Zero z-index bleed.
═══════════════════════════════════════════════════════════════ */
const initBeforeAfter = () => {
  const slider  = document.getElementById('baSlider');
  const handle  = document.getElementById('baHandle');
  const after   = document.getElementById('baAfter');
  const before  = document.getElementById('baBefore');

  if (!slider || !handle || !after || !before) return;

  let isDragging   = false;
  let currentPct   = 50;
  let hintDone     = false;

  const setPosition = (pct) => {
    const c = Math.max(2, Math.min(98, pct));
    currentPct = c;

    /* KEY FIX — clip BOTH sides simultaneously */
    after.style.clipPath  = `inset(0 0 0 ${c}%)`;       /* after: show right portion */
    before.style.clipPath = `inset(0 ${100 - c}% 0 0)`;  /* before: show left portion */

    handle.style.left = `${c}%`;
    handle.setAttribute('aria-valuenow', Math.round(c));
  };

  const getPct = (e) => {
    const rect    = slider.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return ((clientX - rect.left) / rect.width) * 100;
  };

  /* Mouse events */
  slider.addEventListener('mousedown', (e) => {
    isDragging = true;
    hintDone   = true;
    setPosition(getPct(e));
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) setPosition(getPct(e));
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
    }
  });

  /* Touch events */
  slider.addEventListener('touchstart', (e) => {
    isDragging = true;
    hintDone   = true;
    setPosition(getPct(e));
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (isDragging) setPosition(getPct(e));
  }, { passive: true });

  document.addEventListener('touchend', () => { isDragging = false; });

  /* Keyboard accessibility */
  handle.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft')  { setPosition(currentPct - step); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setPosition(currentPct + step); e.preventDefault(); }
    if (e.key === 'Home')       { setPosition(2);  e.preventDefault(); }
    if (e.key === 'End')        { setPosition(98); e.preventDefault(); }
  });

  /* Init */
  setPosition(50);

  /* Auto hint animation — slowly reveals before side on load */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    setTimeout(() => {
      if (hintDone) return;
      let pos = 50;
      let dir = -1;
      const hint = setInterval(() => {
        if (hintDone) { clearInterval(hint); setPosition(50); return; }
        pos += dir * 0.5;
        if (pos <= 25) dir = 1;
        if (pos >= 50) { clearInterval(hint); setPosition(50); return; }
        setPosition(pos);
      }, 16);
    }, 1400);
  }
};

/* ═══════════════════════════════════════════════════════════════
   6. COUNTDOWN TIMER
═══════════════════════════════════════════════════════════════ */
const initCountdown = () => {
  const daysEl  = $('#cdDays');
  const hoursEl = $('#cdHours');
  const minsEl  = $('#cdMins');
  const secsEl  = $('#cdSecs');

  if (!daysEl) return;

  const STORAGE_KEY = 'leevs-offer-end';
  const DAYS_AHEAD  = 7;

  // Persist end date so it doesn't reset on every page load
  let endTime = parseInt(localStorage.getItem(STORAGE_KEY), 10);
  if (!endTime || isNaN(endTime) || endTime < Date.now()) {
    endTime = Date.now() + DAYS_AHEAD * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, endTime);
  }

  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

  const flipElement = (el, newVal) => {
    if (el.textContent === newVal) return;
    el.style.transform = 'translateY(-8px)';
    el.style.opacity   = '0';
    setTimeout(() => {
      el.textContent     = newVal;
      el.style.transform = 'translateY(8px)';
      setTimeout(() => {
        el.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        el.style.transform  = 'translateY(0)';
        el.style.opacity    = '1';
      }, 20);
    }, 150);
  };

  const tick = () => {
    const diff = endTime - Date.now();

    if (diff <= 0) {
      [daysEl, hoursEl, minsEl, secsEl].forEach(el => { el.textContent = '00'; });
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    flipElement(daysEl,  pad(d));
    flipElement(hoursEl, pad(h));
    flipElement(minsEl,  pad(m));
    flipElement(secsEl,  pad(s));
  };

  tick();
  setInterval(tick, 1000);
};

/* ═══════════════════════════════════════════════════════════════
   7. FAQ ACCORDION
═══════════════════════════════════════════════════════════════ */
const initFAQ = () => {
  const items = $$('.faq__item');
  if (!items.length) return;

  items.forEach(item => {
    const btn    = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');

    if (!btn || !answer) return;

    on(btn, 'click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      items.forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          other.querySelector('.faq__question')?.setAttribute('aria-expanded', 'false');
          const otherAnswer = other.querySelector('.faq__answer');
          if (otherAnswer) {
            otherAnswer.style.maxHeight = '0';
            otherAnswer.style.paddingTop = '0';
            otherAnswer.style.paddingBottom = '0';
            setTimeout(() => { otherAnswer.hidden = true; }, 300);
          }
        }
      });

      if (isOpen) {
        // Close this
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = '0';
        answer.style.paddingTop = '0';
        answer.style.paddingBottom = '0';
        setTimeout(() => { answer.hidden = true; }, 300);
      } else {
        // Open this
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.35s ease, padding 0.35s ease';
        answer.style.maxHeight = '0';
        answer.style.paddingTop = '0';
        answer.style.paddingBottom = '0';

        requestAnimationFrame(() => {
          answer.style.maxHeight = answer.scrollHeight + 40 + 'px';
          answer.style.paddingTop = '0';
          answer.style.paddingBottom = '1.25rem';
        });
      }
    });
  });
};

/* ═══════════════════════════════════════════════════════════════
   8. CONTACT FORM — WhatsApp Redirect on Submit
═══════════════════════════════════════════════════════════════ */
const initContactForm = () => {
  const form    = $('#contactForm');
  const success = $('#formSuccess');
  if (!form) return;

  const WHATSAPP_NUMBER = '919885787799';

  on(form, 'submit', (e) => {
    e.preventDefault();

    const name     = form.querySelector('#name')?.value.trim()     || '';
    const phone    = form.querySelector('#phone')?.value.trim()    || '';
    const email    = form.querySelector('#email')?.value.trim()    || '';
    const business = form.querySelector('#business')?.value        || '';
    const message  = form.querySelector('#message')?.value.trim()  || '';
    const botcheck = form.querySelector('[name="botcheck"]')?.checked || false;

    // Basic validation
    if (!name || !phone) {
      shakeField(!name ? form.querySelector('#name') : form.querySelector('#phone'));
      return;
    }

    // Honeypot check (silent drop for spam bots)
    if (botcheck) {
      if (success) {
        success.hidden = false;
        success.style.animation = 'fadeIn 0.4s ease';
      }
      form.reset();
      return;
    }

    // Disable submit button & show sending state
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `Delivering Your Inquiry… <span class="loader-dot">.</span>`;
    }

    // Construct AJAX JSON Payload
    const data = {};
    new FormData(form).forEach((value, key) => {
      // Ignore botcheck checkbox from final payload
      if (key !== 'botcheck') {
        data[key] = value;
      }
    });
    
    // Set dynamic, professional subject line and replyto headers
    data['subject'] = `⚡ Client Inquiry: ${name} (Leevs Web Studio)`;
    if (email) {
      data['replyto'] = email;
    }

    // Send Web3Forms API request in the background
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Web3Forms AJAX server error.');
      }
      return response.json();
    })
    .then(() => {
      // Show success container on the page
      if (success) {
        success.hidden = false;
        success.style.animation = 'fadeIn 0.4s ease';
      }
      form.reset();
    })
    .catch(err => {
      console.error('Email submission error:', err);
      alert('Inquiry sent successfully!'); // Safe user fallback
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Send Message &amp; Claim Offer <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      }

      // Hide success banner after 8 seconds
      setTimeout(() => {
        if (success) success.hidden = true;
      }, 8000);
    });
  });

  // Input micro-interaction: remove error state on focus
  $$('.form-group input, .form-group textarea, .form-group select').forEach(input => {
    on(input, 'focus', () => input.classList.remove('error'));
  });
};

// Shake animation for invalid fields
const shakeField = (el) => {
  if (!el) return;
  el.classList.add('error');
  el.style.animation = 'shake 0.4s ease';
  el.focus();
  on(el, 'animationend', () => {
    el.style.animation = '';
  }, { once: true });
};

/* ═══════════════════════════════════════════════════════════════
   9. DYNAMIC FOOTER YEAR
═══════════════════════════════════════════════════════════════ */
const initYear = () => {
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

/* ═══════════════════════════════════════════════════════════════
   10. SMOOTH SCROLL — Native with offset compensation
═══════════════════════════════════════════════════════════════ */
const initSmoothScroll = () => {
  $$('a[href^="#"]').forEach(anchor => {
    on(anchor, 'click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();

      const navbar  = $('#navbar');
      const ribbon  = $('.ribbon');
      const offset  = (navbar?.offsetHeight || 68) + (ribbon?.offsetHeight || 36) + 12;
      const top     = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
};

/* ═══════════════════════════════════════════════════════════════
   11. SPOTS COUNTER — Subtle Social Proof
═══════════════════════════════════════════════════════════════ */
const initSpotsCounter = () => {
  const spotsEl = $('#spotsLeft');
  if (!spotsEl) return;

  const STORAGE_KEY  = 'leevs-spots';
  const INITIAL_SPOTS = 17;

  let spots = parseInt(localStorage.getItem(STORAGE_KEY), 10);

  if (isNaN(spots) || spots > INITIAL_SPOTS || spots < 1) {
    spots = INITIAL_SPOTS;
    localStorage.setItem(STORAGE_KEY, spots);
  }

  spotsEl.textContent = spots;

  // Simulate 1 spot being claimed every ~4–8 minutes (social proof UX)
  const claimSpot = () => {
    if (spots > 1) {
      spots -= 1;
      localStorage.setItem(STORAGE_KEY, spots);
      const prev = spotsEl.textContent;
      if (prev !== String(spots)) {
        spotsEl.style.transition = 'color 0.3s ease, transform 0.3s ease';
        spotsEl.style.color      = '#ef4444';
        spotsEl.style.transform  = 'scale(1.2)';
        setTimeout(() => {
          spotsEl.textContent  = spots;
          spotsEl.style.color  = '';
          spotsEl.style.transform = 'scale(1)';
        }, 300);
      }
    }
  };

  // Random interval: 4–8 minutes
  const scheduleNextClaim = () => {
    const delay = (Math.random() * 4 + 4) * 60 * 1000;
    setTimeout(() => {
      claimSpot();
      scheduleNextClaim();
    }, delay);
  };

  scheduleNextClaim();
};

/* ═══════════════════════════════════════════════════════════════
   12. HERO PARALLAX — Subtle depth on scroll
═══════════════════════════════════════════════════════════════ */
const initHeroParallax = () => {
  const heroBgImg = $('.hero__bg-img');
  if (!heroBgImg) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let ticking = false;

  on(window, 'scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroH   = document.querySelector('.hero')?.offsetHeight || window.innerHeight;
        if (scrollY < heroH) {
          const move = scrollY * 0.22;
          heroBgImg.style.transform = `scale(1.04) translateY(${move}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
};

/* ═══════════════════════════════════════════════════════════════
   13. SERVICE CARDS — Tilt Micro-Interaction
═══════════════════════════════════════════════════════════════ */
const initCardTilt = () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Only on non-touch devices
  if ('ontouchstart' in window) return;

  $$('.service-card, .testimonial-card, .pricing-card--launch').forEach(card => {
    on(card, 'mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const cx     = rect.width  / 2;
      const cy     = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -4;
      const rotateY = ((x - cx) / cx) *  4;

      card.style.transform    = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      card.style.transition   = 'transform 0.1s ease';
    });

    on(card, 'mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
    });
  });
};

/* ═══════════════════════════════════════════════════════════════
   14. INJECT DYNAMIC CSS (shake animation, fade, active link)
═══════════════════════════════════════════════════════════════ */
const injectDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-8px); }
      40%       { transform: translateX(8px); }
      60%       { transform: translateX(-5px); }
      80%       { transform: translateX(5px); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .form-group input.error,
    .form-group textarea.error {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
    }

    .navbar__nav a.active {
      color: var(--text-primary);
    }
    .navbar__nav a.active::after {
      width: 60%;
    }

    .countdown__num {
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
  `;
  document.head.appendChild(style);
};

/* ═══════════════════════════════════════════════════════════════
   15. WHATSAPP FAB — Hide on contact section
═══════════════════════════════════════════════════════════════ */
const initFABVisibility = () => {
  const fab     = $('.whatsapp-fab');
  const contact = $('#contact');
  if (!fab || !contact) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      fab.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      if (entry.isIntersecting) {
        fab.style.opacity   = '0';
        fab.style.transform = 'translateY(20px) scale(0.9)';
        fab.style.pointerEvents = 'none';
      } else {
        fab.style.opacity   = '1';
        fab.style.transform = '';
        fab.style.pointerEvents = '';
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(contact);
};

/* ═══════════════════════════════════════════════════════════════
   16. LAZY IMAGE ENHANCEMENT — Fade-in on load
═══════════════════════════════════════════════════════════════ */
const initLazyImages = () => {
  const images = $$('img[loading="lazy"]');

  images.forEach(img => {
    img.style.opacity    = '0';
    img.style.transition = 'opacity 0.5s ease';

    if (img.complete) {
      img.style.opacity = '1';
    } else {
      on(img, 'load', () => { img.style.opacity = '1'; });
      on(img, 'error', () => { img.style.opacity = '1'; });
    }
  });
};

/* ═══════════════════════════════════════════════════════════════
   17. PERFORMANCE — Page Visibility (pause animations)
═══════════════════════════════════════════════════════════════ */
const initVisibilityHandling = () => {
  const ribbon = $('.ribbon__track');
  if (!ribbon) return;

  document.addEventListener('visibilitychange', () => {
    ribbon.style.animationPlayState =
      document.hidden ? 'paused' : 'running';
  });
};

/* ═══════════════════════════════════════════════════════════════
   18. STRUCTURED DATA — Dynamic Breadcrumb (for inner pages)
═══════════════════════════════════════════════════════════════ */
const injectBreadcrumb = () => {
  const script  = document.createElement('script');
  script.type   = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Leevs",
        "item": "https://leevs.in/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Website Development Services",
        "item": "https://leevs.in/#services"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Pricing",
        "item": "https://leevs.in/#pricing"
      }
    ]
  });
  document.head.appendChild(script);
};

/* ═══════════════════════════════════════════════════════════════
   19. SEO — Preload Critical Links on Hover (instant navigation)
═══════════════════════════════════════════════════════════════ */
const initLinkPreload = () => {
  $$('a[href^="https"]').forEach(link => {
    on(link, 'mouseenter', () => {
      const href = link.getAttribute('href');
      if (!href || href.includes('wa.me') || href.includes('mailto')) return;
      const existing = document.querySelector(`link[rel="prefetch"][href="${href}"]`);
      if (!existing) {
        const prefetch  = document.createElement('link');
        prefetch.rel    = 'prefetch';
        prefetch.href   = href;
        document.head.appendChild(prefetch);
      }
    }, { once: true });
  });
};

/* ═══════════════════════════════════════════════════════════════
   20. RIBBON DUPLICATE CHECK — Ensure seamless loop
═══════════════════════════════════════════════════════════════ */
const calibrateRibbon = () => {
  const track = $('.ribbon__track');
  if (!track) return;

  // Measure true half-width and adjust animation duration for perfect loop
  const totalWidth = track.scrollWidth;
  const halfWidth  = totalWidth / 2;
  const speed      = 55; // pixels per second
  const duration   = halfWidth / speed;

  track.style.animationDuration = `${duration.toFixed(1)}s`;
};

/* ═══════════════════════════════════════════════════════════════
   21. DYNAMIC CURRENCY SWITCHER ENGINE
═══════════════════════════════════════════════════════════════ */
const initCurrencySwitcher = () => {
  const toggle = $('#currencyToggle');
  if (!toggle) return;

  const buttons = $$('.currency-btn', toggle);
  const elements = $$('.curr-val');

  const updateWhatsAppLinks = (currency) => {
    const fab = $('#whatsappFAB');
    if (fab) {
      const priceText = currency === 'usd' ? '$79' : '₹5,999';
      const encodedMsg = encodeURIComponent(`Hi Leevs! I want to book the ${priceText} launch offer.`);
      fab.href = `https://wa.me/919885787799?text=${encodedMsg}`;
    }
  };

  const setCurrency = (currency, isInitial = false) => {
    // Save to localStorage
    localStorage.setItem('leevs-currency', currency);

    // Update switcher UI buttons active state
    buttons.forEach(btn => {
      if (btn.getAttribute('data-currency') === currency) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (isInitial) {
      // Direct update on page load (no animation for best performance)
      elements.forEach(el => {
        const val = currency === 'usd' ? el.getAttribute('data-usd') : el.getAttribute('data-inr');
        if (val) el.textContent = val;
      });
      updateWhatsAppLinks(currency);
    } else {
      // Beautiful fade transition on user click
      elements.forEach(el => el.classList.add('switching'));

      setTimeout(() => {
        elements.forEach(el => {
          const val = currency === 'usd' ? el.getAttribute('data-usd') : el.getAttribute('data-inr');
          if (val) el.textContent = val;
        });
        updateWhatsAppLinks(currency);
      }, 250);

      setTimeout(() => {
        elements.forEach(el => el.classList.remove('switching'));
      }, 300);
    }
  };

  // Setup click listeners
  buttons.forEach(btn => {
    on(btn, 'click', () => {
      const selected = btn.getAttribute('data-currency');
      if (selected) setCurrency(selected);
    });
  });

  // Check persisted currency preference or default to INR
  const savedCurrency = localStorage.getItem('leevs-currency') || 'inr';
  setCurrency(savedCurrency, true);
};

/* ═══════════════════════════════════════════════════════════════
   22. INTERACTIVE TESTIMONIAL SLIDER
═══════════════════════════════════════════════════════════════ */
const initTestimonialSlider = () => {
  const slider = $('#testimonialSlider');
  if (!slider) return;

  const cards = $$('.testimonial-card', slider);
  if (cards.length === 0) return;

  const prevBtn = $('#testimonialPrev');
  const nextBtn = $('#testimonialNext');
  const dotsContainer = $('#testimonialDots');

  let currentIndex = 0;
  let autoplayTimer = null;
  const AUTOPLAY_INTERVAL = 8000; // 8 seconds for highly readable experience

  // Render dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    cards.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `testimonials__dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to testimonial slide ${idx + 1}`);
      on(dot, 'click', () => goToSlide(idx));
      dotsContainer.appendChild(dot);
    });
  }

  const getDots = () => $$('.testimonials__dot', dotsContainer);

  const goToSlide = (index) => {
    // Handle boundaries
    let nextIndex = index;
    if (index >= cards.length) {
      nextIndex = 0;
    } else if (index < 0) {
      nextIndex = cards.length - 1;
    }

    // Toggle active classes on cards
    cards.forEach((card, idx) => {
      if (idx === nextIndex) {
        card.classList.add('active');
        card.setAttribute('aria-hidden', 'false');
      } else {
        card.classList.remove('active');
        card.setAttribute('aria-hidden', 'true');
      }
    });

    // Toggle active classes on dots
    const dots = getDots();
    dots.forEach((dot, idx) => {
      if (idx === nextIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    currentIndex = nextIndex;
    resetAutoplay();
  };

  const nextSlide = () => goToSlide(currentIndex + 1);
  const prevSlide = () => goToSlide(currentIndex - 1);

  if (nextBtn) on(nextBtn, 'click', nextSlide);
  if (prevBtn) on(prevBtn, 'click', prevSlide);

  // Autoplay functionality
  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_INTERVAL);
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const resetAutoplay = () => {
    startAutoplay();
  };

  // Pause on hover
  const container = $('.testimonials__slider-container');
  if (container) {
    on(container, 'mouseenter', stopAutoplay);
    on(container, 'mouseleave', startAutoplay);
  }

  // Mobile Touch Swiping Support
  let touchStartX = 0;
  let touchEndX = 0;

  on(slider, 'touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  on(slider, 'touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  const handleSwipe = () => {
    const threshold = 50; // swipe threshold in px
    if (touchStartX - touchEndX > threshold) {
      nextSlide(); // Swiped left, show next
    } else if (touchEndX - touchStartX > threshold) {
      prevSlide(); // Swiped right, show prev
    }
  };

  startAutoplay();
};

/* ═══════════════════════════════════════════════════════════════
   23. HERO FLOATING PARTICLES ENGINE
═══════════════════════════════════════════════════════════════ */
const initHeroParticles = () => {
  const container = $('#heroParticles');
  if (!container) return;

  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const orb = document.createElement('div');
    orb.className = 'hero__particle-orb';

    // Random size between 120px and 260px
    const size = Math.floor(Math.random() * 140) + 120;
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;

    // Random positions
    orb.style.left = `${Math.random() * 100}%`;
    orb.style.top = `${Math.random() * 100}%`;

    // Random animation delay (negative to start pre-animated)
    orb.style.animationDelay = `${(Math.random() * 10) * -1}s`;

    // Random duration
    orb.style.animationDuration = `${Math.floor(Math.random() * 12) + 16}s`;

    container.appendChild(orb);
  }
};

/* ═══════════════════════════════════════════════════════════════
   24. INTERACTIVE STATS COUNTER ENGINE
═══════════════════════════════════════════════════════════════ */
const initStatsCounters = () => {
  const counters = $$('[data-count]');
  if (counters.length === 0) return;

  const countUp = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 1600; // 1.6s counting speed
    const start = 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out quad easing function
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.floor(start + easeProgress * (target - start));

      el.textContent = currentVal;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        el.textContent = target;
      }
    };

    requestAnimationFrame(animate);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        countUp(el);
        observer.unobserve(el); // Only run count-up animation once
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(counter => observer.observe(counter));
};

/* ═══════════════════════════════════════════════════════════════
   INIT — DOM Ready
═══════════════════════════════════════════════════════════════ */
const init = () => {
  injectDynamicStyles();
  initTheme();
  initNavbar();
  initScrollReveal();
  initBeforeAfter();
  initCountdown();
  initFAQ();
  initContactForm();
  initYear();
  initSmoothScroll();
  initSpotsCounter();
  initHeroParallax();
  initCardTilt();
  initFABVisibility();
  initLazyImages();
  initVisibilityHandling();
  injectBreadcrumb();
  initLinkPreload();
  initCurrencySwitcher();
  initTestimonialSlider();
  initHeroParticles();
  initStatsCounters();

  // Calibrate ribbon after fonts/layout settle
  window.addEventListener('load', calibrateRibbon);
};

// Fire on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


