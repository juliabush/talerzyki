(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("open", open);
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!open);
  });

  nav.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 720px)").matches) {
        setOpen(false);
      }
    });
  });

  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 720px)").matches) {
      setOpen(false);
    }
  });
})();

(() => {
  function labelPhotoDot(indexOneBased, total) {
    const flat = window.__tonariMessages;
    const fromFile = flat && flat["about.photoDot"];
    const tpl =
      fromFile ||
      (document.documentElement.lang === "pl" ? "Zdjęcie {{n}} z {{total}}" : "Photo {{n}} of {{total}}");
    return tpl.replace(/\{\{\s*n\s*\}\}/g, String(indexOneBased)).replace(/\{\{\s*total\s*\}\}/g, String(total));
  }

  function refreshDotLabels() {
    const root = document.querySelector("[data-about-gallery]");
    if (!root || root.dataset.galleryReady !== "1") return;
    const dotsWrap = root.querySelector(".about-photo-dots");
    const slides = root.querySelectorAll(".about-photo-card");
    if (!dotsWrap || !slides.length) return;
    dotsWrap.querySelectorAll(".about-photo-dot").forEach((dot, i) => {
      dot.setAttribute("aria-label", labelPhotoDot(i + 1, slides.length));
    });
  }

  function initAboutGallery() {
    const root = document.querySelector("[data-about-gallery]");
    if (!root || root.dataset.galleryReady === "1") return;

    const viewport = root.querySelector(".about-photo-grid");
    const dotsWrap = root.querySelector(".about-photo-dots");
    const slides = root.querySelectorAll(".about-photo-card");
    if (!viewport || !dotsWrap || !slides.length) return;

    root.dataset.galleryReady = "1";

    const mq = window.matchMedia("(max-width: 720px)");

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "about-photo-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", labelPhotoDot(i + 1, slides.length));
      if (i === 0) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", () => {
        slides[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
      dotsWrap.appendChild(dot);
    });

    const activeIndex = () => {
      const rr = viewport.getBoundingClientRect();
      const mid = rr.left + rr.width / 2;
      let best = 0;
      let bestD = Infinity;
      slides.forEach((el, i) => {
        const b = el.getBoundingClientRect();
        const c = b.left + b.width / 2;
        const d = Math.abs(c - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    };

    const syncDots = () => {
      if (!mq.matches) return;
      const idx = activeIndex();
      dotsWrap.querySelectorAll(".about-photo-dot").forEach((dot, i) => {
        const on = i === idx;
        dot.classList.toggle("is-active", on);
        if (on) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    };

    const stepSlide = (delta) => {
      const next = Math.max(0, Math.min(slides.length - 1, activeIndex() + delta));
      slides[next]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    };

    let tick = 0;
    viewport.addEventListener(
      "scroll",
      () => {
        if (!mq.matches) return;
        cancelAnimationFrame(tick);
        tick = requestAnimationFrame(syncDots);
      },
      { passive: true },
    );

    viewport.addEventListener("keydown", (e) => {
      if (!mq.matches) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepSlide(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepSlide(1);
      }
    });

    window.addEventListener("resize", () => requestAnimationFrame(syncDots), { passive: true });
    mq.addEventListener("change", syncDots);
    requestAnimationFrame(syncDots);
  }

  document.addEventListener("tonari:locale", refreshDotLabels);
  initAboutGallery();
})();

(() => {
  function labelFoodGalleryDot(indexOneBased, total) {
    const flat = window.__tonariMessages;
    const fromFile = flat && flat["gallery.photoDot"];
    const tpl =
      fromFile ||
      (document.documentElement.lang === "pl" ? "Zdjęcie {{n}} z {{total}}" : "Photo {{n}} of {{total}}");
    return tpl.replace(/\{\{\s*n\s*\}\}/g, String(indexOneBased)).replace(/\{\{\s*total\s*\}\}/g, String(total));
  }

  function refreshFoodGalleryDotLabels() {
    const root = document.querySelector("[data-food-gallery]");
    if (!root || root.dataset.foodGalleryReady !== "1") return;
    const dotsWrap = root.querySelector(".food-gallery-dots");
    const originals = root.querySelectorAll(".food-gallery-card:not([data-food-gallery-clone])");
    if (!dotsWrap || !originals.length) return;
    dotsWrap.querySelectorAll(".food-gallery-dot").forEach((dot, i) => {
      dot.setAttribute("aria-label", labelFoodGalleryDot(i + 1, originals.length));
    });
  }

  function initFoodGallery() {
    const root = document.querySelector("[data-food-gallery]");
    if (!root || root.dataset.foodGalleryReady === "1") return;

    const viewport = root.querySelector(".food-gallery-viewport");
    const dotsWrap = root.querySelector(".food-gallery-dots");
    /** Stable references to real slides (never belt clones). */
    const originalsRef = Array.from(viewport?.querySelectorAll(".food-gallery-card") ?? []);
    if (!viewport || !dotsWrap || !originalsRef.length) return;

    root.dataset.foodGalleryReady = "1";

    const mq = window.matchMedia("(max-width: 720px)");
    const mqDesktop = window.matchMedia("(min-width: 721px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    /** Desktop conveyor speed (px/s); tweak for faster/slower belt */
    const BELT_PX_PER_SEC = 44;

    function scrollModeInline() {
      return mq.matches ? "center" : "nearest";
    }

    let hoverOrFocusPause = false;
    let beltRafId = null;
    let beltLastTs = 0;

    function stopFoodGalleryBelt() {
      if (beltRafId != null) {
        cancelAnimationFrame(beltRafId);
        beltRafId = null;
      }
      beltLastTs = 0;
    }

    function syncFoodGalleryBeltDom() {
      viewport.querySelectorAll("[data-food-gallery-clone]").forEach((n) => n.remove());
      if (!mqDesktop.matches || mqReduce.matches) {
        viewport.scrollLeft = 0;
        return;
      }
      originalsRef.forEach((el) => {
        const c = el.cloneNode(true);
        c.setAttribute("data-food-gallery-clone", "true");
        c.setAttribute("aria-hidden", "true");
        viewport.appendChild(c);
      });
      const half = viewport.scrollWidth / 2;
      if (half > 8 && viewport.scrollLeft >= half - 1) {
        viewport.scrollLeft -= half;
      }
    }

    function beltFrame(ts) {
      beltRafId = null;
      if (!mqDesktop.matches || mqReduce.matches || document.hidden || hoverOrFocusPause) {
        beltLastTs = 0;
        return;
      }
      const half = viewport.scrollWidth / 2;
      if (half < 8) return;
      if (!beltLastTs) beltLastTs = ts;
      const dt = Math.min(0.064, Math.max(0, (ts - beltLastTs) / 1000));
      beltLastTs = ts;
      viewport.scrollLeft += BELT_PX_PER_SEC * dt;
      while (viewport.scrollLeft >= half) {
        viewport.scrollLeft -= half;
      }
      beltRafId = requestAnimationFrame(beltFrame);
    }

    function resumeFoodGalleryBeltIfNeeded() {
      if (!mqDesktop.matches || mqReduce.matches || document.hidden || hoverOrFocusPause) return;
      if (beltRafId != null) return;
      beltLastTs = 0;
      beltRafId = requestAnimationFrame(beltFrame);
    }

    function startFoodGalleryBelt() {
      stopFoodGalleryBelt();
      if (!mqDesktop.matches || mqReduce.matches) return;
      syncFoodGalleryBeltDom();
      requestAnimationFrame(() => {
        beltLastTs = 0;
        resumeFoodGalleryBeltIfNeeded();
      });
    }

    /* Desktop: pause belt while cursor is over the gallery */
    root.addEventListener("mouseenter", () => {
      if (mqDesktop.matches) hoverOrFocusPause = true;
    });
    root.addEventListener("mouseleave", () => {
      hoverOrFocusPause = false;
      resumeFoodGalleryBeltIfNeeded();
    });

    viewport.addEventListener("focusin", () => {
      hoverOrFocusPause = true;
    });
    viewport.addEventListener("focusout", () => {
      hoverOrFocusPause = false;
      resumeFoodGalleryBeltIfNeeded();
    });

    originalsRef.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "food-gallery-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", labelFoodGalleryDot(i + 1, originalsRef.length));
      if (i === 0) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", () => {
        originalsRef[i]?.scrollIntoView({
          behavior: "smooth",
          inline: scrollModeInline(),
          block: "nearest",
        });
      });
      dotsWrap.appendChild(dot);
    });

    const activeIndex = () => {
      const rr = viewport.getBoundingClientRect();
      const mid = rr.left + rr.width / 2;
      let best = 0;
      let bestD = Infinity;
      originalsRef.forEach((el, i) => {
        const b = el.getBoundingClientRect();
        const c = b.left + b.width / 2;
        const d = Math.abs(c - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    };

    const syncDots = () => {
      if (!mq.matches) return;
      const idx = activeIndex();
      dotsWrap.querySelectorAll(".food-gallery-dot").forEach((dot, i) => {
        const on = i === idx;
        dot.classList.toggle("is-active", on);
        if (on) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    };

    const stepSlide = (delta) => {
      const next = Math.max(0, Math.min(originalsRef.length - 1, activeIndex() + delta));
      originalsRef[next]?.scrollIntoView({
        behavior: "smooth",
        inline: scrollModeInline(),
        block: "nearest",
      });
    };

    let tick = 0;
    viewport.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(tick);
        tick = requestAnimationFrame(syncDots);
      },
      { passive: true },
    );

    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepSlide(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepSlide(1);
      }
    });

    window.addEventListener(
      "resize",
      () => {
        requestAnimationFrame(() => {
          syncFoodGalleryBeltDom();
          syncDots();
          if (mqDesktop.matches && !mqReduce.matches) startFoodGalleryBelt();
          else stopFoodGalleryBelt();
        });
      },
      { passive: true },
    );
    mq.addEventListener("change", () => {
      requestAnimationFrame(() => {
        syncFoodGalleryBeltDom();
        syncDots();
        if (mq.matches) stopFoodGalleryBelt();
        else startFoodGalleryBelt();
      });
    });
    mqDesktop.addEventListener("change", () => {
      requestAnimationFrame(() => {
        syncFoodGalleryBeltDom();
        if (!mqDesktop.matches) {
          viewport.scrollTo({ left: 0, behavior: "auto" });
          stopFoodGalleryBelt();
        } else {
          startFoodGalleryBelt();
        }
      });
    });
    mqReduce.addEventListener("change", () => {
      requestAnimationFrame(() => {
        syncFoodGalleryBeltDom();
        if (mqDesktop.matches && !mqReduce.matches) startFoodGalleryBelt();
        else stopFoodGalleryBelt();
      });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopFoodGalleryBelt();
      else if (mqDesktop.matches && !mqReduce.matches) startFoodGalleryBelt();
    });

    window.addEventListener("load", () => {
      requestAnimationFrame(() => {
        syncFoodGalleryBeltDom();
        if (mqDesktop.matches && !mqReduce.matches) startFoodGalleryBelt();
      });
    }, { once: true });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncFoodGalleryBeltDom();
        syncDots();
        if (mqDesktop.matches && !mqReduce.matches) startFoodGalleryBelt();
      });
    });
  }

  document.addEventListener("tonari:locale", refreshFoodGalleryDotLabels);
  initFoodGallery();
})();
