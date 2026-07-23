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

/* ─── PANEL SZCZEGÓŁÓW USŁUGI ─── */
const SERVICES_DB = {
  "powloka-ceramiczna": {
    cat: "Ochrona",
    title: "Powłoka ceramiczna",
    lead: "Powłoka ceramiczna SiO₂ trwale wiąże się z lakierem, tworząc twardą, przezroczystą warstwę ochronną. To rozwiązanie dla kierowców, którzy chcą, by auto wyglądało jak prosto z myjni przez lata, a nie tygodnie.",
    badgeTop: "GWARANCJA", badgeValue: "1-10", badgeBottom: "LAT",
    benefits: [
      "Głęboki, mokry połysk utrzymujący się do 2–3 lat",
      "Efekt hydrofobowy — brud i woda spływają same",
      "Ochrona przed promieniowaniem UV i wypalaniem koloru",
      "Odporność chemiczna — łatwiejsze usuwanie owadów i smoły",
      "Łatwiejsze i szybsze mycie na co dzień"
    ],
    chars: "Powłoka na bazie dwutlenku krzemu (SiO₂) po utwardzeniu tworzy warstwę o twardości zbliżonej do szkła, całkowicie przezroczystą i niewidoczną na lakierze. W przeciwieństwie do wosku nie zmywa się — wiąże się chemicznie z powierzchnią lakieru. Przed aplikacją lakier jest dokładnie dekontaminowany, a w razie potrzeby poddawany korekcie, by powłoka nie zamknęła w sobie żadnych zabrudzeń ani rys.",
    price: "od 1500 zł",
    duration: "2–3 dni robocze",
    steps: [
      { t: "Mycie i dekontaminacja", d: "Dokładne mycie dwuetapowe, usunięcie zanieczyszczeń mineralnych i odtłuszczenie lakieru przed aplikacją." },
      { t: "Aplikacja powłoki", d: "Nakładanie warstw powłoki w kontrolowanych warunkach studia, bez kurzu i wilgoci." },
      { t: "Utwardzanie i kontrola", d: "Sprawdzenie równomierności powłoki w świetle detailingowym i przekazanie instrukcji pielęgnacji." }
    ]
  },

  "folia-ppf": {
    cat: "Ochrona",
    title: "Folie ochronne PPF i zmiany koloru",
    lead: "Folia PPF (Paint Protection Film) to przezroczysta, elastyczna warstwa poliuretanu, która fizycznie chroni lakier przed odpryskami kamieni, rysami i otarciami parkingowymi. Oferujemy też folie zmieniające kolor — nowy wygląd auta bez lakierowania.",
    badgeTop: "GWARANCJA", badgeValue: "1-10", badgeBottom: "LAT",
    benefits: [
      "Fizyczna ochrona przed odpryskami i zarysowaniami",
      "Samoregeneracja drobnych rys pod wpływem ciepła",
      "Całkowita niewidoczność na lakierze",
      "Możliwość zmiany koloru auta bez lakierowania",
      "Zachowanie wartości pojazdu na rynku wtórnym"
    ],
    chars: "Folia wykonana jest z elastycznego poliuretanu o grubości ok. 150–200 mikronów — znacznie grubszej ochronie niż jakakolwiek powłoka ceramiczna. Warstwa samoregenerująca sprawia, że drobne rysy znikają pod wpływem ciepła (słońce, ciepła woda). Aplikujemy folię metodą na mokro, z zawijaniem krawędzi do wewnątrz elementu, dzięki czemu efekt jest praktycznie niewidoczny.",
    kind: "packages",
    packageOrder: ["BASIC", "FULL_FRONT", "FULL_BODY"],
    packages: {
      BASIC: {
        label: "BASIC",
        name: "Pakiet BASIC",
        desc: "Ochrona najbardziej narażonych elementów: przedni zderzak, krawędź maski, reflektory, lusterka i wnęki klamek.",
        list: ["Przedni zderzak", "Krawędź maski (ok. 30 cm)", "Reflektory i lusterka", "Wnęki klamek przód i tył"],
        price: "od 3000 zł",
        duration: "2–3 dni robocze",
        zones: ["bumperFront", "headlightL", "headlightR", "hoodEdge", "mirrorL", "mirrorR", "handleFL", "handleFR", "handleRL", "handleRR"]
      },
      FULL_FRONT: {
        label: "Full Front",
        name: "Pakiet Full Front",
        desc: "Pełna ochrona przodu auta: cała maska, błotniki przednie, zderzak, reflektory i lusterka.",
        list: ["Przedni zderzak", "Cała maska", "Błotniki przednie", "Reflektory i lusterka", "Wnęki klamek przód i tył"],
        price: "od 4000 zł",
        duration: "3–4 dni robocze",
        zones: ["bumperFront", "headlightL", "headlightR", "hoodEdge", "hoodRest", "fenderFL", "fenderFR", "mirrorL", "mirrorR", "handleFL", "handleFR", "handleRL", "handleRR"]
      },
      FULL_BODY: {
        label: "Full Body",
        name: "Pakiet Full Body",
        desc: "Pełne zabezpieczenie całego nadwozia — maksymalna, długoterminowa ochrona lakieru na lata.",
        list: ["Cały przód (zderzak, maska, błotniki)", "Dach, drzwi i słupki", "Tylne błotniki, klapa i zderzak", "Lusterka i wnęki wszystkich klamek"],
        price: "od 15000 zł",
        duration: "5–7 dni roboczych",
        zones: ["bumperFront", "headlightL", "headlightR", "hoodEdge", "hoodRest", "fenderFL", "fenderFR", "mirrorL", "mirrorR", "handleFL", "handleFR", "doorFL", "doorFR", "roof", "doorRL", "doorRR", "handleRL", "handleRR", "fenderRL", "fenderRR", "trunk", "bumperRear"]
      }
    },
    addons: [
      { name: "Reflektory osobno", price: "od 300 zł" },
      { name: "Lusterka osobno", price: "od 300 zł" },
      { name: "Zabezpieczenie progów", price: "od 250 zł" },
      { name: "Folia PPF na wnętrze (progi, tunel)", price: "od 500 zł" },
      { name: "Zabezpieczenie szyby czołowej", price: "od 1000 zł" },
      { name: "Dechroming (matowienie chromów)", price: "od 100 zł" }
    ],
    steps: [
      { t: "Demontaż i przygotowanie", d: "Bezpieczny demontaż niezbędnych elementów oraz gruntowne oczyszczenie i odtłuszczenie powierzchni." },
      { t: "Aplikacja folii", d: "Precyzyjna aplikacja na mokro z zawijaniem krawędzi do wewnątrz elementu dla niewidocznego efektu." },
      { t: "Kontrola jakości", d: "Sprawdzenie każdej krawędzi, wygrzanie folii i ponowny montaż elementów — auto gotowe do odbioru." }
    ]
  },

  "zabezpieczenie-felg": {
    cat: "Ochrona",
    title: "Zabezpieczenie felg",
    lead: "Powłoka ceramiczna na felgach tworzy twardą warstwę odporną na wysoką temperaturę, która znacznie ułatwia mycie i chroni przed pyłem hamulcowym oraz solą drogową.",
    badgeTop: "GWARANCJA", badgeValue: "1", badgeBottom: "ROK",
    benefits: [
      "Odporność na wysoką temperaturę hamulców",
      "Łatwiejsze usuwanie pyłu hamulcowego",
      "Głęboki połysk felgi",
      "Ochrona przed solą i preparatami odladzającymi"
    ],
    chars: "Powłoka ceramiczna do felg wytrzymuje temperatury generowane przez układ hamulcowy oraz agresywne działanie soli drogowej. Dzięki niej pył hamulcowy nie przywiera trwale do powierzchni i łatwo się go zmywa podczas zwykłego mycia auta.",
    price: "od 400 zł",
    duration: "1 dzień",
    steps: [
      { t: "Mycie i dekontaminacja felg", d: "Dokładne odtłuszczenie i usunięcie osadu hamulcowego z całej powierzchni felgi." },
      { t: "Aplikacja powłoki", d: "Nałożenie powłoki na każdą felgę osobno, warstwa po warstwie." },
      { t: "Utwardzenie", d: "Kontrola równomierności i czas na związanie powłoki przed odbiorem auta." }
    ]
  },

  "niewidzialna-wycieraczka": {
    cat: "Ochrona",
    title: "Niewidzialna wycieraczka",
    lead: "Hydrofobowa powłoka na szybę czołową sprawia, że krople wody zamiast przywierać do szkła, zsuwają się pod wpływem pędu powietrza — poprawia to widoczność podczas deszczu, zwłaszcza przy większych prędkościach.",
    badgeTop: "EFEKT", badgeValue: "12", badgeBottom: "MIES.",
    benefits: [
      "Lepsza widoczność podczas deszczu",
      "Mniejsze zużycie wycieraczek",
      "Łatwiejsze usuwanie owadów i brudu z szyby",
      "Efekt utrzymuje się do 6–12 miesięcy"
    ],
    chars: "Powłoka hydrofobowa wnika w mikropory szkła, zwiększając kąt spływu wody. Krople formują się w kulki i są zdmuchiwane z szyby przez strumień powietrza już przy prędkości ok. 60–70 km/h, co w praktyce ogranicza potrzebę używania wycieraczek.",
    price: "od 200 zł",
    duration: "1 dzień",
    steps: [
      { t: "Oczyszczenie szyby", d: "Dokładne odtłuszczenie i polerowanie szkła przed aplikacją, usunięcie starych powłok." },
      { t: "Aplikacja powłoki", d: "Nałożenie preparatu hydrofobowego na szybę czołową (opcjonalnie także boczne i lusterka)." },
      { t: "Utwardzenie", d: "Czas na związanie powłoki — zalecamy nie moczyć szyby przez kilka godzin po zabiegu." }
    ]
  },

  "renowacja-lakieru": {
    cat: "Renowacja",
    title: "Renowacja lakieru",
    lead: "Wieloetapowa korekta lakieru usuwa rysy, hologramy i zmatowienia, przywracając lakierowi głębię koloru i lustrzany połysk — często lepszy, niż w dniu odbioru auta z salonu.",
    badgeTop: "SKUTECZNOŚĆ", badgeValue: "95", badgeBottom: "%",
    benefits: [
      "Usunięcie do 95% rys i hologramów",
      "Przywrócenie głębi koloru i lustrzanego połysku",
      "Pomiar grubości lakieru przed rozpoczęciem pracy",
      "Idealne przygotowanie pod powłokę ceramiczną"
    ],
    chars: "Korekta lakieru to wieloetapowy proces polerowania z użyciem gradacji ściernych past i padów, dobranych indywidualnie do stanu i twardości lakieru. Przed rozpoczęciem zawsze mierzymy grubość powłoki lakierniczej grubościomierzem, by bezpiecznie usunąć tylko wierzchnią, uszkodzoną warstwę.",
    price: "od 700 zł",
    duration: "1 dzień roboczy (jednoetapowa) do 2 dni (pełna korekta)",
    steps: [
      { t: "Mycie i pomiar lakieru", d: "Dekontaminacja lakieru i pomiar grubości powłoki grubościomierzem w kilkudziesięciu punktach nadwozia." },
      { t: "Polerowanie wieloetapowe", d: "Usuwanie rys i hologramów gradacją past ściernych, od najostrzejszej do wykańczającej." },
      { t: "Zabezpieczenie", d: "Przetarcie lakieru i naniesienie warstwy ochronnej (wosk lub powłoka) zamykającej efekt korekty." }
    ]
  },

  "renowacja-tapicerki": {
    cat: "Renowacja",
    title: "Renowacja tapicerki skórzanej",
    lead: "Przebarwienia, przetarcia i pęknięcia skóry obniżają wartość auta i psują pierwsze wrażenie. Profesjonalna renowacja przywraca oryginalny kolor i miękkość skóry, zamykając ją warstwą ochronną.",
    badgeTop: "DOŚWIADCZENIE", badgeValue: "7", badgeBottom: "LAT",
    benefits: [
      "Przywrócenie oryginalnego koloru skóry",
      "Naprawa przetarć i drobnych pęknięć",
      "Miękka, przyjemna w dotyku powierzchnia",
      "Ochrona przed dalszym zużyciem"
    ],
    chars: "Renowacja obejmuje głębokie czyszczenie, ewentualną naprawę przetarć oraz barwienie skóry pigmentami dobranymi do oryginalnego koloru producenta. Na koniec nakładana jest warstwa ochronna, która zamyka kolor i ułatwia dalszą pielęgnację.",
    price: "od 250 zł",
    duration: "1 dzień",
    steps: [
      { t: "Czyszczenie głębokie", d: "Usunięcie brudu, tłuszczu i starych powłok z porów skóry przed dalszą pracą." },
      { t: "Naprawa i barwienie", d: "Wypełnienie przetarć, dobór i aplikacja pigmentu w kolorze oryginalnym dla danego modelu." },
      { t: "Zabezpieczenie", d: "Nałożenie warstwy nawilżająco-ochronnej, przywracającej naturalną miękkość skóry." }
    ]
  },

  "mycie-detailingowe": {
    cat: "Pielęgnacja",
    title: "Mycie detailingowe",
    lead: "Wieloetapowe mycie ręczne z użyciem profesjonalnych produktów o dobranym pH — bez myjni automatycznych i bez ryzyka rys myjących. Podstawa każdej innej usługi w naszym studiu.",
    badgeTop: "KLIENCI", badgeValue: "98", badgeBottom: "% WRACA",
    benefits: [
      "Bezpieczna metoda dwuwiadrowa — bez rys myjących",
      "Dokładne czyszczenie progów, felg i wnęk",
      "Produkty o pH dobranym do powłok i wosków",
      "Auto gotowe pod dalsze zabiegi ochronne"
    ],
    chars: "Mycie prowadzimy metodą dwuwiadrową z rękawicami z mikrofibry, minimalizując ryzyko zarysowania lakieru. Wstępnie usuwamy zanieczyszczenia pianą aktywną, osobno czyścimy felgi i progi, a na koniec auto jest dokładnie osuszane mikrofibrą i sprężonym powietrzem w newralgicznych miejscach.",
    price: "od 100 zł",
    duration: "1–2 godziny",
    steps: [
      { t: "Mycie wstępne", d: "Spłukanie luźnych zanieczyszczeń i aplikacja piany aktywnej rozpuszczającej brud." },
      { t: "Mycie właściwe", d: "Mycie metodą dwuwiadrową, osobne czyszczenie felg, progów i wnęk podwoziowych." },
      { t: "Osuszanie", d: "Osuszanie chłonną mikrofibrą i sprężonym powietrzem, kontrola efektu w świetle detailingowym." }
    ]
  },

  "detailing-wnetrza": {
    cat: "Pielęgnacja",
    title: "Full detailing wnętrza",
    lead: "Kompleksowe czyszczenie tapicerki, plastików i dywaników oraz zabezpieczenie ich trwałymi, niewidocznymi powłokami ochronnymi — wnętrze czyste i pachnące jak w nowym aucie.",
    badgeTop: "DOŚWIADCZENIE", badgeValue: "7", badgeBottom: "LAT",
    benefits: [
      "Głębokie czyszczenie tapicerki i dywaników",
      "Odświeżenie i zabezpieczenie plastików",
      "Usunięcie nieprzyjemnych zapachów u źródła",
      "Powłoki ochronne odporne na plamy"
    ],
    chars: "Czyszczenie wnętrza obejmuje odkurzanie wszystkich zakamarków, pranie tapicerki materiałowej lub czyszczenie skóry, mycie plastików i szyb od wewnątrz oraz aplikację powłok zabezpieczających przed zabrudzeniami i promieniowaniem UV.",
    price: "od 400 zł",
    duration: "pół dnia do 1 dnia",
    steps: [
      { t: "Odkurzanie i wstępne czyszczenie", d: "Dokładne odkurzenie wszystkich powierzchni, foteli, szczelin i bagażnika." },
      { t: "Pranie i czyszczenie", d: "Pranie ekstrakcyjne tapicerki lub czyszczenie skóry oraz mycie plastików i szyb." },
      { t: "Zabezpieczenie", d: "Aplikacja powłok ochronnych na tapicerkę i plastiki, kontrola efektu końcowego." }
    ]
  },

  "systemy-antykradziezowe": {
    cat: "Ochrona",
    title: "Systemy antykradzieżowe",
    lead: "Autoryzowany montaż systemów lokalizacyjnych Meta System i RMT. Dyskretna instalacja i aplikacja w telefonie pozwalają śledzić pozycję auta i błyskawicznie reagować w razie próby kradzieży.",
    badgeTop: "AUTORYZOWANY", badgeValue: "2", badgeBottom: "MARKI",
    benefits: [
      "Lokalizacja auta w czasie rzeczywistym z telefonu",
      "Dyskretny montaż, niewidoczny dla osób trzecich",
      "Autoryzowany instalator Meta System i RMT",
      "Może obniżyć koszt ubezpieczenia AC"
    ],
    chars: "Montujemy systemy lokalizacyjne jako autoryzowany instalator marek Meta System i RMT. System działa niezależnie od instalacji elektrycznej auta i pozwala namierzyć pojazd nawet po odcięciu zasilania przez złodzieja, a wszystko obsługuje się z aplikacji na telefonie.",
    price: "wycena indywidualna",
    duration: "pół dnia",
    steps: [
      { t: "Dobór systemu", d: "Konsultacja i dobór modelu lokalizatora dopasowanego do marki i modelu auta." },
      { t: "Instalacja", d: "Dyskretny montaż nadajnika w miejscu niewidocznym i trudno dostępnym dla osób trzecich." },
      { t: "Konfiguracja", d: "Aktywacja usługi, konfiguracja aplikacji mobilnej i test działania przed odbiorem auta." }
    ]
  },

  "zmiana-koloru": {
    cat: "Ochrona",
    title: "Zmiana koloru auta",
    lead: "Oklejanie całego nadwozia lub wybranych elementów folią w dowolnym kolorze i wykończeniu — od głębokiej czerni po matowe i satynowe akcenty — bez lakierowania i utraty wartości auta.",
    badgeTop: "KOLORY", badgeValue: "50", badgeBottom: "+",
    benefits: [
      "Pełna zmiana wizerunku bez lakierowania",
      "Folia chroni oryginalny lakier pod spodem",
      "Możliwość powrotu do koloru fabrycznego",
      "Wykończenia: mat, satyna, połysk, chrom"
    ],
    chars: "Folie zmieniające kolor aplikujemy na cały nadwozie lub wybrane elementy (dach, lusterka, pasy). Folia nie tylko zmienia wygląd auta, ale też chroni oryginalny lakier producenta, który pozostaje nienaruszony pod spodem — w każdej chwili można wrócić do fabrycznego koloru.",
    price: "wycena indywidualna",
    duration: "kilka dni roboczych",
    steps: [
      { t: "Konsultacja i dobór folii", d: "Wybór koloru i wykończenia z próbek, wycena na podstawie modelu i stanu lakieru." },
      { t: "Przygotowanie i aplikacja", d: "Dokładne mycie, ewentualny demontaż elementów i precyzyjna aplikacja folii." },
      { t: "Kontrola i wykończenie", d: "Sprawdzenie krawędzi, docięcie w trudnych miejscach i ponowny montaż elementów." }
    ]
  },

  "spersonalizowane-projekty": {
    cat: "Personalizacja",
    title: "Spersonalizowane projekty",
    lead: "Masz wizję auta jedynego w swoim rodzaju? Projektujemy i wykonujemy indywidualne oklejenia, pasy i akcenty — od pierwszego szkicu, przez wizualizację, po pełną realizację.",
    badgeTop: "PROJEKTY", badgeValue: "100", badgeBottom: "% UNIKALNE",
    benefits: [
      "Indywidualny projekt dopasowany do Twojego auta",
      "Wizualizacja przed rozpoczęciem prac",
      "Dowolne kolory, pasy i akcenty graficzne",
      "Materiały odporne na blaknięcie i warunki atmosferyczne"
    ],
    chars: "Każdy projekt zaczynamy od rozmowy o wizji klienta i stylu auta. Przygotowujemy wizualizację, którą można konsultować i poprawiać, zanim jakakolwiek folia trafi na karoserię. Dopiero zaakceptowany projekt trafia do realizacji na profesjonalnych plotterach tnących.",
    price: "od 1000 zł",
    duration: "ustalany indywidualnie",
    steps: [
      { t: "Konsultacja i koncepcja", d: "Rozmowa o oczekiwaniach, stylu i budżecie, pierwsze szkice koncepcyjne." },
      { t: "Projekt i wizualizacja", d: "Przygotowanie cyfrowej wizualizacji na zdjęciu Twojego auta do akceptacji." },
      { t: "Realizacja", d: "Wycięcie grafiki na plotterze i precyzyjna aplikacja na nadwoziu." }
    ]
  },

  "doposazenia": {
    cat: "Personalizacja",
    title: "Doposażenia",
    lead: "Oświetlenie ambientowe, kamery cofania, monitory i elektronika samochodowa — doposażamy auto w rozwiązania, których nie dał producent, montowane fachowo i bez ingerencji w gwarancję.",
    badgeTop: "MONTAŻ", badgeValue: "1", badgeBottom: "DZIEŃ",
    benefits: [
      "Oświetlenie ambientowe LED w dowolnym kolorze",
      "Kamery cofania i czujniki parkowania",
      "Montaż bez ingerencji w gwarancję producenta",
      "Estetyczne prowadzenie przewodów, bez śladów montażu"
    ],
    chars: "Dobieramy i montujemy dodatkowe wyposażenie elektroniczne — od podświetlenia ambientowego, przez kamery i czujniki, po monitory multimedialne. Każdy montaż wykonujemy starannie, z ukryciem przewodów, tak by efekt wyglądał jak fabryczny.",
    price: "od 500 zł",
    duration: "1 dzień",
    steps: [
      { t: "Dobór wyposażenia", d: "Konsultacja i dobór komponentów dopasowanych do marki i modelu auta." },
      { t: "Montaż", d: "Instalacja z ukryciem przewodów i zachowaniem estetyki wnętrza." },
      { t: "Test i konfiguracja", d: "Sprawdzenie działania, konfiguracja ustawień i instruktaż obsługi." }
    ]
  }
};

const svModal = document.getElementById("svModal");
if (svModal) {
  let svLastFocus = null;
  let svActivePkg = null;

  function renderPackage(s, pkgKey) {
    const pkg = s.packages[pkgKey];
    svActivePkg = pkgKey;
    document.querySelectorAll("#svPkgTabs .svpkg__tab").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.pkg === pkgKey);
      btn.setAttribute("aria-selected", btn.dataset.pkg === pkgKey ? "true" : "false");
    });
    document.getElementById("svPkgName").textContent = pkg.name;
    document.getElementById("svPkgDesc").textContent = pkg.desc;
    document.getElementById("svPkgList").innerHTML = pkg.list.map(li => `<li>${li}</li>`).join("");
    document.getElementById("svPkgPrice").textContent = pkg.price;
    document.getElementById("svPkgDuration").textContent = pkg.duration;
    document.querySelectorAll(".svcar__zone").forEach(zone => {
      zone.classList.toggle("is-active", pkg.zones.includes(zone.dataset.zone));
    });
  }

  function openServiceModal(id) {
    const s = SERVICES_DB[id];
    if (!s) return;
    document.getElementById("svCat").textContent = s.cat;
    document.getElementById("svTitle").textContent = s.title;
    document.getElementById("svLead").textContent = s.lead;
    document.getElementById("svBadgeTop").textContent = s.badgeTop || "GWARANCJA";
    document.getElementById("svWarranty").textContent = s.badgeValue;
    document.getElementById("svBadgeBottom").textContent = s.badgeBottom || "LATA";
    document.getElementById("svChars").textContent = s.chars;
    document.getElementById("svBenefits").innerHTML = s.benefits.map(b => `<li>${b}</li>`).join("");
    document.getElementById("svSteps").innerHTML = s.steps.map(st => `<li><b>${st.t}</b><p>${st.d}</p></li>`).join("");

    const isPackages = s.kind === "packages";
    document.getElementById("svMeta").hidden = isPackages;
    document.getElementById("svPackages").hidden = !isPackages;

    if (isPackages) {
      document.getElementById("svPkgTabs").innerHTML = s.packageOrder.map(key =>
        `<button class="svpkg__tab" data-pkg="${key}" role="tab">${s.packages[key].label}</button>`
      ).join("");
      document.getElementById("svPkgTabs").querySelectorAll("[data-pkg]").forEach(btn => {
        btn.addEventListener("click", () => renderPackage(s, btn.dataset.pkg));
      });
      document.getElementById("svAddons").innerHTML = s.addons.map(a =>
        `<div><span>${a.name}</span><b>${a.price}</b></div>`
      ).join("");
      renderPackage(s, s.packageOrder[0]);
    } else {
      document.getElementById("svPrice").textContent = s.price;
      document.getElementById("svDuration").textContent = s.duration;
    }

    svLastFocus = document.activeElement;
    svModal.classList.add("is-open");
    svModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    svModal.querySelector(".svmodal__scroll").scrollTop = 0;
    svModal.querySelector(".svmodal__close").focus();
  }

  function closeServiceModal() {
    svModal.classList.remove("is-open");
    svModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (svLastFocus) svLastFocus.focus();
  }

  document.querySelectorAll("[data-service]").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      openServiceModal(a.dataset.service);
    });
    a.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openServiceModal(a.dataset.service);
      }
    });
  });
  svModal.querySelectorAll("[data-svclose]").forEach(el => el.addEventListener("click", closeServiceModal));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && svModal.classList.contains("is-open")) closeServiceModal();
  });
}
