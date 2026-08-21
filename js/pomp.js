/**
 * File: js/pomp.js
 * All site custom JS for pompandcircumstancepr.com — single source of truth,
 * served via jsDelivr (request pomp.min.js for the minified build).
 *
 * Load order matters and is guaranteed by `defer` in webflow/_footer.html:
 * jQuery and the Webflow runtime (non-deferred, emitted by Webflow) run first,
 * then swiper-bundle, then lenis, then this file — deferred scripts execute in
 * document order.
 *
 * Sections:
 * 1) Service Slider (Swiper)
 * 2) Lenis Smooth Scrolling
 * 3) Nav Shrink On Scroll
 * 4) Colon Line-Break
 * 5) Hero Video Guard
 */

(() => {
  'use strict';

  //=============================================================================
  // 1) SERVICE SLIDER (Swiper)
  //    One Swiper per .service-slider-w wrapper, nav scoped inside that wrapper.
  //=============================================================================
  function initServiceSliders() {
    if (typeof Swiper === 'undefined') return; // library missing — fail quiet

    document.querySelectorAll('.service-slider-w').forEach((wrap) => {
      const el = wrap.querySelector('.swiper');
      if (!el || el.swiper) return; // nothing to mount, or already mounted

      new Swiper(el, {
        observer: true,
        observeParents: true,
        spaceBetween: 24,
        loop: true,
        autoplay: { delay: 2000 },
        speed: 800,
        centeredSlides: true,
        addSlidesAfter: 2,
        addSlidesBefore: 2,
        slidesPerView: 'auto',
        navigation: {
          nextEl: wrap.querySelector('.swiper-next'),
          prevEl: wrap.querySelector('.swiper-prev'),
        },
      });
    });
  }

  //=============================================================================
  // 2) LENIS SMOOTH SCROLLING
  //    `lenis` is exposed on window so other modules can scroll through it.
  //=============================================================================
  function initLenis() {
    if (typeof Lenis === 'undefined') return; // library missing — fail quiet
    if (window.Webflow?.env?.('editor')) return; // never run inside the Editor
    if (window.lenis) return; // already initialised

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });
    window.lenis = lenis;

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      // No GSAP on this page — drive Lenis from its own rAF loop instead.
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  //=============================================================================
  // 3) NAV SHRINK ON SCROLL
  //    Toggles .is-shrunk on the nav wrappers once past 5vh.
  //=============================================================================
  function initNavShrink() {
    const targets = document.querySelectorAll(
      '.g-navigation-w, .s-g-navigation, .sw-g-nav'
    );
    if (!targets.length) return;

    const getThresholdPx = () => window.innerHeight * 0.05; // 5vh
    let thresholdPx = getThresholdPx();

    const update = () => {
      const shouldShrink = window.scrollY >= thresholdPx;
      targets.forEach((el) => el.classList.toggle('is-shrunk', shouldShrink));
    };

    const onResize = () => {
      thresholdPx = getThresholdPx();
      update();
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
  }

  //=============================================================================
  // 4) COLON LINE-BREAK
  //    Inside [data-colon-break], turns "Label: value" into "Label:<br> value".
  //    Idempotent — elements are marked once processed.
  //=============================================================================
  function initColonBreak() {
    const process = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) {
        if (n.nodeValue.indexOf(': ') !== -1) nodes.push(n);
      }
      nodes.forEach((node) => {
        const parts = node.nodeValue.split(': ');
        if (parts.length < 2) return;
        const frag = document.createDocumentFragment();
        parts.forEach((p, i) => {
          if (i > 0) {
            frag.appendChild(document.createTextNode(':'));
            frag.appendChild(document.createElement('br'));
            frag.appendChild(document.createTextNode(' '));
          }
          frag.appendChild(document.createTextNode(p));
        });
        node.parentNode.replaceChild(frag, node);
      });
    };

    document
      .querySelectorAll('[data-colon-break]:not([data-colon-break-done])')
      .forEach((el) => {
        process(el);
        el.setAttribute('data-colon-break-done', '1');
      });
  }

  //=============================================================================
  // 5) HERO VIDEO GUARD
  //    The hero video is a full-viewport element with no painted background of
  //    its own, so a source that stalls or fails leaves the top of the page
  //    black. css/pomp.css paints the brand ground behind it; this adds the
  //    behavioural half: retry a blocked autoplay once, and if no frame has
  //    decoded within 6s, mark the wrapper so the fallback is unmistakable.
  //    Marking is additive — it never hides a video that is merely slow.
  //=============================================================================
  function initHeroVideoGuard() {
    document.querySelectorAll('.home-hero-default-bg video').forEach((video) => {
      const wrap = video.closest('.home-hero-default-bg') || video.parentElement;

      const settle = () => {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          wrap?.setAttribute('data-hero-video', 'ok');
          return true;
        }
        return false;
      };

      // Some browsers refuse autoplay even when muted; ask once, quietly.
      const nudge = () => {
        if (!video.paused) return;
        video.muted = true; // property, not just the attribute
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      };

      video.addEventListener('loadeddata', settle, { once: true });
      video.addEventListener('canplay', nudge, { once: true });
      video.addEventListener('error', () =>
        wrap?.setAttribute('data-hero-video', 'failed')
      );

      nudge();

      window.setTimeout(() => {
        if (!settle()) wrap?.setAttribute('data-hero-video', 'failed');
      }, 6000);
    });
  }

  //=============================================================================
  // INIT
  //=============================================================================
  const modules = [
    ['ServiceSlider', initServiceSliders],
    ['Lenis', initLenis],
    ['NavShrink', initNavShrink],
    ['ColonBreak', initColonBreak],
    ['HeroVideoGuard', initHeroVideoGuard],
  ];

  const run = () => {
    modules.forEach(([name, fn]) => {
      try {
        fn();
      } catch (err) {
        try {
          console.error(`[fail] ${name}`, err);
        } catch (_) {}
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
