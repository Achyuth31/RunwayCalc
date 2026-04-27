/**
 * landing.js — Landing Page Interactions
 * ========================================
 * Handles navbar scroll effect, mobile menu,
 * scroll-reveal animations, and the animated
 * counter in the hero mockup.
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ──────────────────────────────────────────
  // Navbar scroll effect
  // ──────────────────────────────────────────
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // Run on load in case page is already scrolled

  // ──────────────────────────────────────────
  // Mobile menu toggle
  // ──────────────────────────────────────────
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', function () {
      navLinks.classList.toggle('active');

      // Update aria for accessibility
      const isOpen = navLinks.classList.contains('active');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      mobileToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ──────────────────────────────────────────
  // Scroll-reveal animation (Intersection Observer)
  // ──────────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target); // Only animate once
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: just show everything
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ──────────────────────────────────────────
  // Hero mockup animated counter
  // ──────────────────────────────────────────
  const mockupNumber = document.getElementById('mockupNumber');

  if (mockupNumber) {
    animateCounter(mockupNumber, 0, 18.5, 1500);
  }

  /**
   * Animates a number from `start` to `end` over `duration` ms.
   * @param {HTMLElement} element
   * @param {number} start
   * @param {number} end
   * @param {number} duration
   */
  function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    const isDecimal = end % 1 !== 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (end - start) * eased;

      element.textContent = isDecimal ? currentValue.toFixed(1) : Math.round(currentValue);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ──────────────────────────────────────────
  // Smooth scroll for anchor links
  // ──────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        event.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
});
