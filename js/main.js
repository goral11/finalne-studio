/* ═══════════════════════════════════════════
   LUXE AUTO STUDIO — interakcje i animacje
   GSAP + ScrollTrigger (CDN), fallback bez JS/reduced-motion
   ═══════════════════════════════════════════ */

document.documentElement.classList.add("js");

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── PRELOADER ─── */
window.addEventListener("load", () => {
  const pre = document.getElementById("preloader");
  setTimeout(() => pre.classList.add("is-done"), prefersReduced ? 0 : 950);
});

/* ─── NAV: tło po scrollu + chowanie przy zjeździe w dół ─── */
const nav = document.getElementById("nav");
let lastY = 0;
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  nav.classList.toggle("is-scrolled", y > 40);
  nav.classList.toggle("is-hidden", y > 500 && y > lastY && !document.getElementById("mobmenu").classList.contains("is-open"));
  lastY = y;
}, { passive: true });

/* ─── MOBILE MENU ─── */
const burger = document.getElementById("burger");
const mobmenu = document.getElementById("mobmenu");
burger.addEventListener("click", () => {
  const open = mobmenu.classList.toggle("is-open");
  burger.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", open);
  mobmenu.setAttribute("aria-hidden", !open);
  document.body.style.overflow = open ? "hidden" : "";
  if (open) {
    mobmenu.querySelectorAll(".mobmenu__links a").forEach((a, i) => {
      a.style.transitionDelay = `${0.08 + i * 0.05}s`;
    });
  }
});
mobmenu.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => burger.click())
);

/* ─── HERO SLIDER ─── */
const SLIDE_TIME = 6500;
const slides = [...document.querySelectorAll(".hero__slide")];
const counterEl = document.getElementById("heroCurrent");
const progressEl = document.getElementById("heroProgress");
let current = 0;
let slideTimer;

/* podział nagłówka na znaki (bez SplitText) */
function splitTitle(el) {
  if (el.dataset.done) return;
  el.dataset.done = "1";
  el.querySelectorAll("em").forEach(wrapChars);
  wrapChars(el);
  function wrapChars(node) {
    [...node.childNodes].forEach(child => {
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      [...child.textContent].forEach(c => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = c === " " ? " " : c;
        frag.appendChild(s);
      });
      node.replaceChild(frag, child);
    });
  }
}

function animateSlideIn(slide) {
  if (prefersReduced || typeof gsap === "undefined") return;
  const title = slide.querySelector("[data-split]");
  splitTitle(title);
  gsap.fromTo(title.querySelectorAll(".ch"),
    { opacity: 0, y: 40, rotateX: -50 },
    { opacity: 1, y: 0, rotateX: 0, duration: 0.7, stagger: 0.022, ease: "expo.out" });
  gsap.fromTo(slide.querySelectorAll(".overline, .hero__lead, .hero__actions"),
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, delay: 0.25, ease: "power2.out" });
}

function goTo(idx) {
  slides[current].classList.remove("is-active");
  current = (idx + slides.length) % slides.length;
  const slide = slides[current];
  slide.classList.add("is-active");
  counterEl.textContent = String(current + 1).padStart(2, "0");
  animateSlideIn(slide);
  restartProgress();
}

function restartProgress() {
  clearTimeout(slideTimer);
  progressEl.classList.remove("is-running");
  void progressEl.offsetWidth;              // restart animacji CSS
  if (!prefersReduced) {
    progressEl.style.setProperty("--slide-time", SLIDE_TIME + "ms");
    progressEl.classList.add("is-running");
  }
  slideTimer = setTimeout(() => goTo(current + 1), SLIDE_TIME);
}

document.getElementById("heroNext").addEventListener("click", () => goTo(current + 1));
document.getElementById("heroPrev").addEventListener("click", () => goTo(current - 1));

document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearTimeout(slideTimer);
  else restartProgress();
});

/* start hero */
window.addEventListener("load", () => {
  setTimeout(() => { animateSlideIn(slides[0]); restartProgress(); }, prefersReduced ? 0 : 1000);
});

/* ─── GSAP: SCROLL REVEALS ─── */
window.addEventListener("load", () => {
  if (typeof gsap === "undefined") {
    // fallback: pokaż wszystko
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-inview"));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (prefersReduced) {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-inview"));
    return;
  }

  document.querySelectorAll(".reveal").forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 28 },
      {
        opacity: 1, y: 0, duration: 0.65, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onComplete: () => el.classList.add("is-inview")
      });
  });

  /* delikatny parallax tła hero przy scrollu */
  gsap.to(".hero__slides", {
    yPercent: 12, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 }
  });
});

/* ─── LICZNIKI (stats) ─── */
const nums = document.querySelectorAll(".stat__num");
const numObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    numObserver.unobserve(el);
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (prefersReduced) { el.textContent = target + suffix; return; }
    const t0 = performance.now();
    const dur = 1400;
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });
}, { threshold: 0.5 });
nums.forEach(el => numObserver.observe(el));

/* ─── FILTR USŁUG ─── */
const tabs = document.querySelectorAll(".services__tab");
const cards = document.querySelectorAll(".scard");
tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(t => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
  tab.classList.add("is-active");
  tab.setAttribute("aria-selected", "true");
  const cat = tab.dataset.cat;
  cards.forEach(card => {
    const show = cat === "all" || card.dataset.cat === cat;
    card.classList.toggle("is-hidden", !show);
    if (show && !prefersReduced && typeof gsap !== "undefined") {
      gsap.fromTo(card, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    }
  });
}));

/* ─── MAGNETIC BUTTONS ─── */
if (!prefersReduced && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.18;
      const y = (e.clientY - r.top - r.height / 2) * 0.3;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
  });
}

/* ─── FORMULARZ (walidacja + mailto) ─── */
const form = document.getElementById("contactForm");
if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    let valid = true;
    ["fName", "fPhone"].forEach(id => {
      const input = document.getElementById(id);
      const bad = !input.value.trim();
      input.closest(".field").classList.toggle("has-error", bad);
      if (bad) valid = false;
    });
    if (!valid) {
      form.querySelector(".has-error input")?.focus();
      return;
    }
    const name = document.getElementById("fName").value.trim();
    const phone = document.getElementById("fPhone").value.trim();
    const service = document.getElementById("fService").value;
    const msg = document.getElementById("fMsg").value.trim();
    const body = encodeURIComponent(`Imię i nazwisko: ${name}\nTelefon: ${phone}\nUsługa: ${service}\n\n${msg}`);
    window.location.href = `mailto:luxeautostudio02@gmail.com?subject=${encodeURIComponent("Zapytanie o wycenę — " + service)}&body=${body}`;
    document.getElementById("formOk").hidden = false;
  });
  ["fName", "fPhone"].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener("blur", () => {
      input.closest(".field").classList.toggle("has-error", !input.value.trim());
    });
  });
}

/* ─── ROK W STOPCE ─── */
document.getElementById("year").textContent = new Date().getFullYear();
