(function () {
  const LINKS = window.LINKS || {};

  function injectLinks() {
    document.querySelectorAll('[data-link]').forEach((el) => {
      const key = el.getAttribute('data-link');
      const url = LINKS[key];
      if (!url) return;

      el.setAttribute('href', url);
      if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  function initStickyHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle('header--scrolled', window.scrollY > 40);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initNavMenu() {
    const header = document.querySelector('.header');
    const toggle = document.querySelector('.header__toggle');
    const nav = document.querySelector('.header__nav');
    const navLinks = document.querySelectorAll('.header__link');
    if (!header || !toggle || !nav) return;

    const closeMenu = () => {
      header.classList.remove('header--open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '開啟選單');
      document.body.style.overflow = '';
    };

    const openMenu = () => {
      header.classList.add('header--open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', '關閉選單');
      document.body.style.overflow = 'hidden';
    };

    toggle.addEventListener('click', () => {
      if (header.classList.contains('header--open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    nav.addEventListener('click', (event) => {
      if (event.target === nav) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) closeMenu();
    });
  }

  function initActiveNavLink() {
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.header__link');
    if (!sections.length || !navLinks.length) return;

    const linkMap = new Map(
      [...navLinks].map((link) => [link.getAttribute('href')?.slice(1), link])
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => link.classList.remove('header__link--active'));
          linkMap.get(id)?.classList.add('header__link--active');
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initScrollReveal() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = document.querySelectorAll('.section-reveal');

    if (prefersReducedMotion) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    sections.forEach((section) => observer.observe(section));
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectLinks();
    initStickyHeader();
    initNavMenu();
    initActiveNavLink();
    initScrollReveal();
  });
})();
