const menuToggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".menu");

function normalizePagePath(href) {
  if (!href) return "";
  try {
    const url = new URL(href, window.location.href);
    let page = url.pathname.split("/").pop() || "index.html";
    if (!page) page = "index.html";
    return page.toLowerCase();
  } catch {
    return "";
  }
}

function initNavActiveState() {
  const rawPage = normalizePagePath(window.location.href) || "index.html";
  let currentPage = rawPage;
  if (rawPage.startsWith("news-")) currentPage = "news.html";
  if (rawPage.startsWith("product-")) currentPage = "products.html";
  if (rawPage.startsWith("career-")) currentPage = "careers.html";
  const navLinks = document.querySelectorAll(".menu a, .navbar-nav .nav-link");
  if (!navLinks.length) return;

  navLinks.forEach((link) => {
    const targetPage = normalizePagePath(link.getAttribute("href"));
    const isCurrent = targetPage === currentPage || (targetPage === "" && currentPage === "index.html");
    link.classList.toggle("is-current", isCurrent);
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function initStickyHeaderState() {
  const headers = document.querySelectorAll(".topbar, .top-nav");
  if (!headers.length) return;

  const sync = () => {
    const isScrolled = window.scrollY > 18;
    headers.forEach((header) => {
      header.classList.toggle("is-scrolled", isScrolled);
    });
  };

  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

function initDesktopMenuIndicator() {
  const menuEl = document.querySelector(".menu");
  if (!menuEl) return;
  const links = Array.from(menuEl.querySelectorAll("a"));
  if (!links.length) return;

  const mobileMq = window.matchMedia("(max-width: 860px)");
  let indicator = null;

  const getActiveLink = () => {
    return menuEl.querySelector("a.is-current, a.active") || links[0] || null;
  };

  const placeIndicator = (target, immediate = false) => {
    if (!indicator || !target) return;
    const menuRect = menuEl.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const x = targetRect.left - menuRect.left;
    const width = targetRect.width;

    if (immediate) {
      indicator.style.transition = "none";
      indicator.style.transform = `translateX(${x}px)`;
      indicator.style.width = `${width}px`;
      indicator.offsetHeight;
      indicator.style.removeProperty("transition");
      return;
    }

    indicator.style.transform = `translateX(${x}px)`;
    indicator.style.width = `${width}px`;
  };

  const syncIndicatorState = (immediate = false) => {
    if (mobileMq.matches) {
      menuEl.classList.remove("menu-indicator-enabled");
      if (indicator) {
        indicator.remove();
        indicator = null;
      }
      return;
    }

    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "menu-indicator";
      menuEl.prepend(indicator);
    }

    menuEl.classList.add("menu-indicator-enabled");
    const activeLink = getActiveLink();
    if (activeLink) {
      placeIndicator(activeLink, immediate);
    }
  };

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      if (mobileMq.matches) return;
      placeIndicator(link);
    });

    link.addEventListener("focus", () => {
      if (mobileMq.matches) return;
      placeIndicator(link);
    });
  });

  menuEl.addEventListener("mouseleave", () => {
    if (mobileMq.matches) return;
    const activeLink = getActiveLink();
    if (activeLink) placeIndicator(activeLink);
  });

  menuEl.addEventListener("focusout", () => {
    if (mobileMq.matches) return;
    window.requestAnimationFrame(() => {
      if (menuEl.contains(document.activeElement)) return;
      const activeLink = getActiveLink();
      if (activeLink) placeIndicator(activeLink);
    });
  });

  window.addEventListener("resize", () => syncIndicatorState(true), { passive: true });
  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", () => syncIndicatorState(true));
  } else if (typeof mobileMq.addListener === "function") {
    mobileMq.addListener(() => syncIndicatorState(true));
  }

  syncIndicatorState(true);
}

if (menuToggle && menu) {
  const closeMenu = () => {
    menu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

function applyImageFallback(img) {
  if (!img || img.dataset.fallbackApplied === "1") return;
  const isHero = !!img.closest(".hero-photo");
  const fallbackSrc = isHero ? "assets/img/hero-fallback.svg" : "assets/img/card-fallback.svg";
  const currentSrc = img.getAttribute("src") || "";
  if (currentSrc.includes("hero-fallback.svg") || currentSrc.includes("card-fallback.svg")) return;

  img.dataset.fallbackApplied = "1";
  img.src = fallbackSrc;
  if (!img.alt || !img.alt.trim()) {
    img.alt = "Image fallback";
  }
}

function wireImageFallbacks() {
  const imgs = document.querySelectorAll("img");
  imgs.forEach((img) => {
    img.addEventListener("error", () => applyImageFallback(img), { once: true });
    if (img.complete && img.naturalWidth === 0) {
      applyImageFallback(img);
    }
  });
}

function initHeroSlider() {
  const slider = document.querySelector("[data-hero-slider]");
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(slider.querySelectorAll("[data-hero-dot]"));
  const prev = slider.querySelector("[data-hero-prev]");
  const next = slider.querySelector("[data-hero-next]");
  if (slides.length <= 1) return;

  let current = 0;
  let timer = null;
  const intervalMs = 5200;

  function setActive(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      slide.classList.toggle("is-active", idx === current);
    });
    dots.forEach((dot, idx) => {
      const active = idx === current;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(() => {
      setActive(current + 1);
    }, intervalMs);
  }

  prev?.addEventListener("click", () => {
    setActive(current - 1);
    startAuto();
  });

  next?.addEventListener("click", () => {
    setActive(current + 1);
    startAuto();
  });

  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => {
      setActive(idx);
      startAuto();
    });
  });

  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  setActive(0);
  startAuto();
}

function initSupportCardHover() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const cards = document.querySelectorAll([
    ".support-grid .support-item",
    ".card",
    ".mini-card",
    ".cert-item",
    ".leader-card",
    ".job-card",
    ".cv-panel",
    ".news-item",
    ".glass-solid"
  ].join(", "));
  if (!cards.length) return;

  cards.forEach((card) => {
    card.classList.add("has-hover-glow");
    let rafId = 0;
    let pendingX = 0;
    let pendingY = 0;

    const flush = () => {
      rafId = 0;
      card.style.setProperty("--hover-x", `${pendingX}px`);
      card.style.setProperty("--hover-y", `${pendingY}px`);
    };

    function updatePointerPosition(event) {
      const rect = card.getBoundingClientRect();
      pendingX = event.clientX - rect.left;
      pendingY = event.clientY - rect.top;
      if (!rafId) {
        rafId = window.requestAnimationFrame(flush);
      }
    }

    card.addEventListener("pointerenter", updatePointerPosition);
    card.addEventListener("pointermove", updatePointerPosition);
    card.addEventListener("pointerenter", () => {
      card.classList.add("is-hovering");
    });
    card.addEventListener("pointerleave", () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      card.classList.remove("is-hovering");
      card.style.removeProperty("--hover-x");
      card.style.removeProperty("--hover-y");
    });
  });
}

function initCertificateScroller() {
  const scrollers = document.querySelectorAll("[data-cert-scroller]");
  if (!scrollers.length) return;

  scrollers.forEach((scroller) => {
    const track = scroller.querySelector("[data-cert-track]");
    const thumb = scroller.parentElement?.querySelector("[data-cert-thumb]");
    if (!track || !thumb) return;

    let stepSize = 0;

    const updateStepSize = () => {
      const firstItem = track.querySelector(".cert-item");
      if (!firstItem) return;
      const trackStyles = window.getComputedStyle(track);
      const gap = parseFloat(trackStyles.columnGap || trackStyles.gap || "0");
      stepSize = firstItem.getBoundingClientRect().width + gap;
    };

    const syncThumb = () => {
      const maxScroll = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
      const visibleRatio = maxScroll > 0 ? scroller.clientWidth / scroller.scrollWidth : 1;
      const thumbWidth = Math.max(visibleRatio * 100, 18);
      const progress = maxScroll > 0 ? scroller.scrollLeft / maxScroll : 0;
      const maxTravel = 100 - thumbWidth;

      thumb.style.width = `${thumbWidth}%`;
      thumb.style.transform = `translateX(${maxTravel * progress}%)`;
      thumb.style.opacity = maxScroll > 0 ? "1" : "0.45";
    };

    const scrollByStep = (direction) => {
      if (!stepSize) updateStepSize();
      if (!stepSize) return;
      scroller.scrollBy({ left: direction * stepSize, behavior: "smooth" });
    };

    scroller.addEventListener("wheel", (event) => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll <= 0) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      scrollByStep(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    scroller.addEventListener("scroll", () => {
      window.requestAnimationFrame(syncThumb);
    }, { passive: true });

    const bar = thumb.parentElement;
    bar?.addEventListener("click", (event) => {
      const rect = bar.getBoundingClientRect();
      const raw = (event.clientX - rect.left) / rect.width;
      const progress = Math.min(Math.max(raw, 0), 1);
      const maxScroll = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
      scroller.scrollTo({ left: progress * maxScroll, behavior: "smooth" });
    });

    window.addEventListener("resize", () => {
      updateStepSize();
      syncThumb();
    }, { passive: true });

    updateStepSize();
    syncThumb();
  });
}

function initCareerStickyPanel() {
  const layout = document.querySelector(".jobs-layout");
  if (!layout) return;
  const totalJobs = layout.querySelectorAll(".jobs .job-card").length;
  layout.classList.toggle("jobs-many", totalJobs > 3);
}

function initFloatingActions() {
  if (document.querySelector(".floating-actions")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "floating-actions";

  const quoteSource = document.querySelector(".nav-wrap > .btn, .topbar .btn-primary");
  const quoteBtn = document.createElement("a");
  quoteBtn.className = "floating-btn floating-btn-quote";
  quoteBtn.href = quoteSource?.getAttribute("href") || "contact.html";
  quoteBtn.textContent = quoteSource?.textContent?.trim() || "Nhan bao gia";
  quoteBtn.setAttribute("aria-label", quoteBtn.textContent);

  const topBtn = document.createElement("button");
  topBtn.type = "button";
  topBtn.className = "floating-btn floating-btn-top";
  topBtn.setAttribute("aria-label", "Len dau trang");
  topBtn.innerHTML = '<i class="bi bi-arrow-up" aria-hidden="true"></i>';
  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  wrapper.appendChild(quoteBtn);
  wrapper.appendChild(topBtn);
  document.body.appendChild(wrapper);
}

function initPage() {
  initNavActiveState();
  initStickyHeaderState();
  initDesktopMenuIndicator();
  wireImageFallbacks();
  initHeroSlider();
  initSupportCardHover();
  initCertificateScroller();
  initCareerStickyPanel();
  initFloatingActions();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}
