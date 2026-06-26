/**
 * 敏維智慧診所 — Main JavaScript
 */

(function () {
  'use strict';

  /* ---- Mobile Navigation ---- */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var mobileNav = document.querySelector('.nav-mobile');
    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- Accordion ---- */
  function initAccordion() {
    document.querySelectorAll('[data-accordion]').forEach(function (accordion) {
      var items = accordion.querySelectorAll('.accordion-item');

      items.forEach(function (item) {
        var trigger = item.querySelector('.accordion-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', function () {
          var isOpen = item.classList.contains('open');

          items.forEach(function (other) {
            other.classList.remove('open');
            var otherTrigger = other.querySelector('.accordion-trigger');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          });

          if (!isOpen) {
            item.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });
  }

  /* ---- Booking Form Validation ---- */
  function initBookingForm() {
    var form = document.getElementById('booking-form');
    var formWrap = document.getElementById('booking-form-wrap');
    var successEl = document.getElementById('form-success');
    if (!form) return;

    function validatePhone(phone) {
      var cleaned = phone.replace(/[\s\-()]/g, '');
      return /^(\+?886)?0?9\d{8}$/.test(cleaned) || /^0\d{1,2}\d{6,8}$/.test(cleaned);
    }

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function setFieldError(group, hasError) {
      if (hasError) {
        group.classList.add('has-error');
      } else {
        group.classList.remove('has-error');
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      var nameGroup = form.querySelector('#name').closest('.form-group');
      var phoneGroup = form.querySelector('#phone').closest('.form-group');
      var emailGroup = form.querySelector('#email').closest('.form-group');

      var name = form.querySelector('#name').value.trim();
      var phone = form.querySelector('#phone').value.trim();
      var email = form.querySelector('#email').value.trim();

      setFieldError(nameGroup, !name);
      if (!name) valid = false;

      setFieldError(phoneGroup, !validatePhone(phone));
      if (!validatePhone(phone)) valid = false;

      setFieldError(emailGroup, !validateEmail(email));
      if (!validateEmail(email)) valid = false;

      if (valid) {
        formWrap.style.display = 'none';
        successEl.classList.add('show');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    form.querySelectorAll('input, textarea, select').forEach(function (field) {
      field.addEventListener('input', function () {
        var group = field.closest('.form-group');
        if (group) group.classList.remove('has-error');
      });
    });
  }

  /* ---- Video Category Filter ---- */
  function initVideoFilter() {
    var filterContainer = document.querySelector('[data-video-filter]');
    var videoGrid = document.getElementById('video-library');
    if (!filterContainer || !videoGrid) return;

    var tabs = filterContainer.querySelectorAll('.filter-tab');
    var videos = videoGrid.querySelectorAll('.video-card');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var category = tab.getAttribute('data-category');

        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        videos.forEach(function (video) {
          var videoCategory = video.getAttribute('data-category');
          if (category === 'all' || videoCategory === category) {
            video.classList.remove('hidden');
          } else {
            video.classList.add('hidden');
          }
        });
      });
    });
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initAccordion();
    initBookingForm();
    initVideoFilter();
  });
})();
