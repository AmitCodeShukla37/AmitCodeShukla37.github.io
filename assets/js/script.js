'use strict';

/**
 * Amit Shukla — Portfolio interactions
 */

const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/**
 * Preloader
 */
window.addEventListener("load", function () {
  const preloader = $("[data-preloader]");
  if (preloader) setTimeout(() => preloader.classList.add("loaded"), 500);
});


/**
 * Footer year
 */
const yearEl = $("[data-year]");
if (yearEl) yearEl.textContent = new Date().getFullYear();


/**
 * Header sticky, go-to-top & scroll progress
 */
const header = $("[data-header]");
const goTopBtn = $("[data-go-top]");
const scrollProgress = $("[data-scroll-progress]");

const onScroll = function () {
  const scrollY = window.scrollY;

  if (scrollY >= 60) {
    header && header.classList.add("active");
    goTopBtn && goTopBtn.classList.add("active");
  } else {
    header && header.classList.remove("active");
    goTopBtn && goTopBtn.classList.remove("active");
  }

  if (scrollProgress) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + "%";
  }
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();


/**
 * Mobile navbar toggle
 */
const navToggleBtn = $("[data-nav-toggle-btn]");
const navbar = $("[data-navbar]");

on(navToggleBtn, "click", function () {
  navToggleBtn.classList.toggle("active");
  navbar.classList.toggle("active");
  document.body.classList.toggle("nav-active");
});

// Close mobile nav when a link is clicked
$$("[data-nav-link]").forEach(link => {
  on(link, "click", function () {
    if (navbar && navbar.classList.contains("active")) {
      navToggleBtn.classList.remove("active");
      navbar.classList.remove("active");
      document.body.classList.remove("nav-active");
    }
  });
});


/**
 * Scroll spy — highlight active nav link
 */
const sections = $$("main section[id]");
const navLinks = $$("[data-nav-link]");

const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute("id");
      navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + id);
      });
    }
  });
}, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

sections.forEach(sec => spyObserver.observe(sec));


/**
 * Download CV (supports multiple buttons)
 */
const downloadCV = function () {
  const link = document.createElement("a");
  link.href = "./assets/Amit_Shukla_Resume.pdf";
  link.download = "Amit_Shukla_Resume.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
["downloadcv"].forEach(id => on(document.getElementById(id), "click", downloadCV));


/**
 * Dark / light theme toggle (persisted)
 */
const themeToggleBtn = $("[data-theme-btn]");

const applyTheme = function (theme) {
  if (theme === "light_theme") {
    document.body.classList.add("light_theme");
    document.body.classList.remove("dark_theme");
  } else {
    document.body.classList.add("dark_theme");
    document.body.classList.remove("light_theme");
  }
};

applyTheme(localStorage.getItem("theme") || "dark_theme");

on(themeToggleBtn, "click", function () {
  const next = document.body.classList.contains("dark_theme") ? "light_theme" : "dark_theme";
  applyTheme(next);
  localStorage.setItem("theme", next);
});


/**
 * Scroll reveal animations
 */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const repeat = entry.target.hasAttribute("data-repeat");
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      if (!repeat) revealObserver.unobserve(entry.target);
    } else if (repeat) {
      // replay the entrance animation every time it re-enters the viewport
      entry.target.classList.remove("in-view");
    }
  });
}, { threshold: 0.12 });

$$("[data-reveal]").forEach((el, i) => {
  el.style.transitionDelay = Math.min(i % 6, 5) * 0.06 + "s";
  revealObserver.observe(el);
});

// Safety net: reveal anything already in the viewport right away, so content is
// never left stuck invisible (e.g. the hero) if the observer is slow to fire.
const revealVisible = function () {
  $$("[data-reveal]").forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) el.classList.add("in-view");
  });
};
window.addEventListener("load", revealVisible);
setTimeout(revealVisible, 400);


/**
 * Animated counters
 */
const animateCount = function (el) {
  const target = parseFloat(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || "";
  const duration = 1600;
  let startTime = null;

  const step = function (ts) {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// Re-animate every time the counter scrolls into view (not just once)
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (!entry.target.dataset.counting) {
        entry.target.dataset.counting = "1";
        animateCount(entry.target);
      }
    } else {
      // reset so it counts up again the next time it re-enters the viewport
      delete entry.target.dataset.counting;
      entry.target.textContent = "0" + (entry.target.dataset.suffix || "");
    }
  });
}, { threshold: 0.5 });

$$("[data-count]").forEach(el => countObserver.observe(el));

// Live GitHub public-repo count for the "Projects" stat
(function () {
  const el = document.querySelector("[data-github-repos]");
  if (!el) return;

  fetch("https://api.github.com/users/AmitCodeShukla37")
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (!data || typeof data.public_repos !== "number") return;
      el.dataset.count = data.public_repos;
      // if it already animated (or is on screen), replay to the real number
      delete el.dataset.counting;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.dataset.counting = "1";
        animateCount(el);
      }
    })
    .catch(() => { /* keep the fallback count */ });
})();


/**
 * Typewriter effect
 */
const typeEl = $("[data-typewriter]");
if (typeEl && !prefersReducedMotion) {
  const words = ["intelligent systems.", "ML & NLP models.", "scalable backends.", "data pipelines.", "clean experiences."];
  let wordIndex = 0, charIndex = 0, deleting = false;

  const type = function () {
    const word = words[wordIndex];
    typeEl.textContent = word.substring(0, charIndex);

    if (!deleting && charIndex < word.length) {
      charIndex++;
      setTimeout(type, 90);
    } else if (deleting && charIndex > 0) {
      charIndex--;
      setTimeout(type, 45);
    } else if (!deleting && charIndex === word.length) {
      deleting = true;
      setTimeout(type, 1600);
    } else {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      setTimeout(type, 300);
    }
  };
  type();
} else if (typeEl) {
  typeEl.textContent = "intelligent systems.";
}


/**
 * Custom cursor
 */
const cursorDot = $("[data-cursor-dot]");
const cursorRing = $("[data-cursor-ring]");

if (cursorDot && cursorRing && window.matchMedia("(hover: hover)").matches) {
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursorDot.style.left = mouseX + "px";
    cursorDot.style.top = mouseY + "px";
    cursorDot.style.opacity = "1";
    cursorRing.style.opacity = "1";
  });

  const renderRing = function () {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.left = ringX + "px";
    cursorRing.style.top = ringY + "px";
    requestAnimationFrame(renderRing);
  };
  renderRing();

  const interactiveSel = "a, button, [data-magnetic], .skill-card, .project-card, input, textarea";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(interactiveSel)) cursorRing.classList.add("hovering");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(interactiveSel)) cursorRing.classList.remove("hovering");
  });
  document.addEventListener("mouseleave", () => {
    cursorDot.style.opacity = "0";
    cursorRing.style.opacity = "0";
  });
}


/**
 * Magnetic buttons
 */
if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
  $$("[data-magnetic]").forEach(btn => {
    on(btn, "mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    on(btn, "mouseleave", () => { btn.style.transform = ""; });
  });
}


/**
 * 3D tilt on cards
 */
if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
  $$("[data-tilt]").forEach(card => {
    on(card, "mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg)`;
    });
    on(card, "mouseleave", () => { card.style.transform = ""; });
  });
}


/**
 * Cursor spotlight glow on project cards
 */
if (window.matchMedia("(hover: hover)").matches) {
  $$(".project-card").forEach(card => {
    on(card, "mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
}


/**
 * Contact form (EmailJS) + toast notification
 */
const toast = $("[data-toast]");
const toastMsg = toast ? $(".toast-msg", toast) : null;

const showToast = function (message, isError) {
  if (!toast) { alert(message); return; }
  toast.classList.toggle("error", !!isError);
  if (toastMsg) toastMsg.textContent = message;
  toast.classList.add("active");
  setTimeout(() => toast.classList.remove("active"), 4000);
};

const contactForm = $("#contact-form");

if (typeof emailjs !== "undefined") {
  emailjs.init("YSpwRnz98loET5Yp1");
}

on(contactForm, "submit", function (e) {
  e.preventDefault();

  const submitBtn = $("button[type='submit']", contactForm);
  const originalHTML = submitBtn ? submitBtn.innerHTML : "";
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = "<span>Sending...</span>"; }

  if (typeof emailjs === "undefined") {
    showToast("Email service unavailable. Please try again later.", true);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalHTML; }
    return;
  }

  emailjs.sendForm("service_791v7de", "template_0f5py8m", this)
    .then(function () {
      showToast("Message sent successfully! I'll be in touch soon.");
      contactForm.reset();
    }, function () {
      showToast("Failed to send message, please try again.", true);
    })
    .finally(function () {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalHTML; }
    });
});


/**
 * Dynamic "live" favicon — animated gradient monogram with a scroll-progress ring
 */
(function () {
  const link = document.getElementById("favicon");
  if (!link) return;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let t = 0;

  const roundRect = function (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const draw = function () {
    t += 0.035;
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2, cy = size / 2;

    // rotating brand gradient background
    const gx = Math.cos(t), gy = Math.sin(t);
    const grad = ctx.createLinearGradient(cx - gx * 30, cy - gy * 30, cx + gx * 30, cy + gy * 30);
    grad.addColorStop(0, "hsl(45, 96%, 56%)");
    grad.addColorStop(0.5, "hsl(24, 90%, 58%)");
    grad.addColorStop(1, "hsl(13, 96%, 52%)");
    ctx.fillStyle = grad;
    roundRect(4, 4, size - 8, size - 8, 16);
    ctx.fill();

    // monogram
    ctx.fillStyle = "#fff";
    ctx.font = "700 28px 'Space Grotesk', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AS", cx, cy + 2);

    // scroll-progress ring (this makes it feel live/interactive)
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const frac = docH > 0 ? Math.min(Math.max(window.scrollY / docH, 0), 1) : 0;
    if (frac > 0.005) {
      ctx.beginPath();
      ctx.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    link.href = canvas.toDataURL("image/png");
  };

  draw();
  setInterval(draw, 150);
})();


/**
 * Criss-cross quest rail — the arrow weaves left↔right between sections, but it only
 * ever runs vertically inside the empty side gutters and crosses the page through the
 * BLANK gaps between sections — so it never cuts over any content. Checkpoints at each
 * section light up as the arrow passes. Hidden when there's no gutter room.
 */
(function () {
  const svg = document.querySelector("[data-arrow]");
  if (!svg) return;
  const track = svg.querySelector("[data-arrow-track]");
  const trail = svg.querySelector("[data-arrow-trail]");
  const nodesG = svg.querySelector("[data-arrow-nodes]");
  const head = svg.querySelector("[data-arrow-head]");
  const NS = "http://www.w3.org/2000/svg";
  head.setAttribute("d", "M -9 -8 L 11 0 L -9 8 L -3 0 Z");

  const secs = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  const heads = secs.map(s => s.querySelector(".hero-title, .section-title"));
  const ok = secs.length && heads.every(Boolean);

  const PAD = 90;
  let totalLen = 0, W = 0, docH = 0, progress = 0;
  let headYs = [];

  // flowing Catmull-Rom → cubic bezier (the original bendy curves)
  const smooth = function (pts) {
    if (pts.length < 2) return "";
    let d = "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1) + " ";
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += "C " + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) +
        " " + p2.x.toFixed(1) + " " + p2.y.toFixed(1) + " ";
    }
    return d;
  };

  const build = function () {
    docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    W = document.documentElement.clientWidth || window.innerWidth;
    const gutter = (W - Math.min(W, 1180)) / 2;
    if (!ok || !W || W <= 1024 || gutter < 60) { svg.style.display = "none"; totalLen = 0; return; }
    svg.style.display = "";

    // hug just outside the content column (not the screen edge) so the rail + its
    // arrow/glow never get clipped at the viewport edges on narrow-gutter laptops.
    const inset = 24;
    const leftX = gutter - inset;             // just left of the content
    const rightX = W - gutter + inset;        // just right of the content
    const sideOf = i => (i % 2 === 0) ? leftX : rightX;
    const headY = i => { const r = heads[i].getBoundingClientRect(); return r.top + window.scrollY + r.height / 2; };
    const secTop = i => secs[i].getBoundingClientRect().top + window.scrollY;

    headYs = heads.map((_, i) => headY(i));

    // waypoints: run down a gutter to each section, then cross DIAGONALLY to the
    // other gutter inside the blank band between sections — a bendy S-curve, no hard
    // 90° corners and no flat crossing over the content.
    const pts = [];
    pts.push({ x: sideOf(0), y: PAD });
    for (let i = 0; i < heads.length; i++) {
      pts.push({ x: sideOf(i), y: headYs[i] });
      if (i < heads.length - 1) {
        const crossY = secTop(i + 1);         // blank gap between section i and i+1
        pts.push({ x: sideOf(i), y: crossY - 45 });
        pts.push({ x: sideOf(i + 1), y: crossY + 45 });
      }
    }
    pts.push({ x: sideOf(heads.length - 1), y: docH - PAD });

    const d = smooth(pts);
    svg.setAttribute("height", docH);
    svg.setAttribute("viewBox", "0 0 " + W + " " + docH);
    svg.setAttribute("preserveAspectRatio", "none");
    track.setAttribute("d", d);
    trail.setAttribute("d", d);
    totalLen = trail.getTotalLength();
    trail.style.strokeDasharray = totalLen;

    nodesG.innerHTML = "";   // checkpoints removed
  };

  const ptAt = function (l) { l = Math.max(0, Math.min(l, totalLen)); return trail.getPointAtLength(l); };

  // find the length along the path whose Y matches a given document Y (path Y is
  // monotonic, so binary-search). This keeps the arrow in sync with your scroll.
  const lenForY = function (y) {
    let lo = 0, hi = totalLen;
    for (let k = 0; k < 22; k++) {
      const mid = (lo + hi) / 2;
      if (ptAt(mid).y < y) lo = mid; else hi = mid;
    }
    return lo;
  };

  const frame = function () {
    requestAnimationFrame(frame);
    if (!totalLen) return;

    // arrow tracks your viewport: near the centre mid-page, but slides toward the
    // bottom as you reach the end so it finishes at the very bottom of the page.
    const maxScroll = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const frac = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    const targetY = window.scrollY + window.innerHeight * (0.5 + 0.5 * frac);
    const target = lenForY(targetY);
    progress += (target - progress) * 0.2;
    trail.style.strokeDashoffset = totalLen - progress;

    const p = ptAt(progress), p2 = ptAt(progress + 2);
    const ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;
    head.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + ang + ")");
    head.style.opacity = "1";

    // glow the heading as soon as the arrow head reaches its topic
    let active = -1;
    for (let i = 0; i < headYs.length; i++) if (p.y >= headYs[i] - 6) active = i;
    for (let i = 0; i < heads.length; i++) heads[i].classList.toggle("head-glow", i === active);
  };

  window.addEventListener("resize", build, { passive: true });
  window.addEventListener("load", build);
  // rebuild on ANY layout change (browser zoom, OS scaling, late images/fonts,
  // reveal shifts) so the rail always matches the content and never overlaps it.
  let rebuildT;
  const scheduleBuild = () => { clearTimeout(rebuildT); rebuildT = setTimeout(build, 120); };
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(scheduleBuild);
    ro.observe(document.body);
  }
  window.addEventListener("load", () => setTimeout(build, 600));
  build();
  requestAnimationFrame(frame);
})();
