# LUXE AUTO STUDIO — strona wizytówka

Statyczna strona studia detailingu samochodowego (Kępno / Olszowa).
Czysty HTML + CSS + JavaScript, bez frameworków. Animacje: GSAP + ScrollTrigger (CDN).

## Struktura
- `index.html` — cała treść strony
- `css/style.css` — style
- `js/main.js` — interakcje (slider, filtr usług, menu, formularz)
- `img/` — logo, zdjęcia realizacji, zdjęcia aut do wynajmu
- `robots.txt`, `sitemap.xml` — SEO
- `vercel.json` — nagłówki cache dla hostingu Vercel

## Podgląd lokalny
```bash
python3 -m http.server 8437
# otwórz http://localhost:8437
```

## Domena
Docelowa domena: **luxe-auto-studio.com** (Cloudflare) — ustawiona w
canonical, og:url, og:image, JSON-LD, robots.txt i sitemap.xml.
