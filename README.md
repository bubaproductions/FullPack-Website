# Full Pack — sito / landing page

Landing page per Full Pack S.r.l. (imballaggi in cartone ondulato) ispirata, per ritmo e qualità, alla hero di unitedcarriers.com.
La hero è una visita documentaria, sincronizzata allo scroll, a uno stabilimento di cartone ondulato ricostruito in scala reale (metri):
porta-bobine e preriscaldatori → single facer (cilindri ondulatori, colla d'amido, rullo di pressione, ponte con festoni) → double facer a piastre calde → slitter-scorer → taglierina rotativa → impilatore → casemaker flexo (mettifoglio, 4 gruppi stampa con anilox/cliché/pressore, cordonatrice-slotter, piegatrice con guide e testa colla, contatore-espulsore) → reggiatrice → pallettizzatore a portale → avvolgitore a tavola rotante → carico laterale con carrello su semirimorchio centinato.
La scena 3D è uno "stage" sticky; i pannelli di testo scorrono sopra di esso e ognuno possiede una fase dell'animazione (come in unitedcarriers.com). Il processo e le macchine seguono la ricerca tecnica riassunta in `docs/processo-ricerca.md`.

## Avvio

È un sito statico (nessuna build). Serve un server locale perché gli script sono moduli ES:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Poi apri http://localhost:8765/ in Chrome, Edge, Firefox o Safari.
Le librerie (three.js 0.165, GSAP 3.12.5 + ScrollTrigger, Lenis 1.0.42) e i font Google vengono caricati da CDN, quindi serve una connessione internet.

## Struttura

- `index.html` — markup e testi in italiano (gli attributi `data-i18n` collegano le traduzioni).
- `css/style.css` — stile, tema scuro della hero, sezioni chiare, responsive.
- `js/hero.js` — assemblaggio scena (capannone, facciata con insegna, piazzale e strada, luci, post-processing) e timeline GSAP. L'asse temporale è misurato in altezze di viewport, così ogni pannello `.panel` (attributo `data-len` / `--len`) corrisponde esattamente a una fase. La camera è un "rig" (punto di fuoco + distanza/azimut/elevazione, helper `K(...)`): ogni movimento è una carrellata o un'orbita, mai uno stacco. L'ondulatore avanza con lo scroll (4,5 m di carta per altezza di viewport); il casemaker avanza esattamente quanto il foglio che la camera segue (`heroMove`, contatore `convDist`). Lo stesso carrello trasporta il bancale di fogli dall'impilatore al sollevatore del casemaker e, più tardi, il bancale avvolto sul centinato.
- `js/hero/materials.js` — materiali PBR procedurali (kraft, carta per onda, bordo ondulato, vernici macchina, acciaio, cemento, legno EPAL, gomma, film).
- `js/hero/corrugator.js` — ondulatore completo (wet end + dry end). `js/hero/converting.js` — casemaker flexo, foglio "eroe" (stampa sotto, cordoni, intagli, due pieghe a 180°), pacchi, pallettizzatore. `js/hero/logistics.js` — bancale EPAL, pacco, avvolgitore, carrello, semirimorchio centinato.
- `js/main.js` — Lenis (smooth scroll), ScrollTrigger, preloader, navigazione, toggle IT/EN, reveal delle sezioni, calcolatore di sviluppo FEFCO 0201 (disegno SVG + m² e peso indicativo), modulo preventivo (compone una email `mailto:` a info@fullpack.it, senza backend) e gestione di `prefers-reduced-motion`.
- `js/i18n.js` — traduzioni inglesi.
- `assets/` — logo (ritagliato dal JPEG originale, con sfondo trasparente), foto estratte dalla brochure e `fullpack-brochure.pdf` (copia della brochure, scaricabile dal sito).

Sezioni della pagina: hero → azienda → processo → prodotti → settori → qualità → sedi (con link a Google Maps) → calcolatore → preventivo → FAQ → contatti → footer (con informativa privacy sintetica). Nel `<head>`: meta Open Graph, `theme-color`, canonical e JSON-LD `Organization` con le quattro sedi.

## Contenuti

Tutti i testi provengono da `BROCHURE FULL PACK.pdf` (servizio, filosofia, mission, prodotti, certificazioni ISO 9001:2015 e FSC® CoC, sedi e contatti).
La scatola animata nella hero è una cassa americana FEFCO 0201, secondo `Box Schema.pdf`.

## Note

- La hero usa WebGL: su browser con rendering software può risultare lenta; su GPU normali gira a 60 fps. Su schermi stretti (<820 px) o CPU con ≤4 core la scena usa un livello "leggero" (niente GTAO, DPR ≤1,25, shadow map 1024). Con `prefers-reduced-motion` lo smooth scroll e l'oscillazione della camera sono disattivati (lo scrub da scroll resta).
- Per cambiare la durata di una fase: modifica `data-len` e `--len` del relativo `.panel` in `index.html` (1.0 = una altezza di viewport). L'ultima altezza di ogni pannello è la transizione al pannello successivo.
- Per ritoccare inquadrature e tempi: le chiamate `K(...)` e i blocchi numerati 0–11 in `js/hero.js`. Tutte le inquadrature nel capannone tengono la camera a z < 6,6 (la facciata è a z = 7).
- Verifica nel browser pane (rendering software): GSAP applica il lag smoothing, quindi dopo uno scroll programmatico la timeline impiega molti secondi a raggiungere il bersaglio; per ispezionare un tempo `t` usare `gsap.ticker.lagSmoothing(0)` e poi `window.__hero.pose(t)` con lo scroll già posizionato sul tempo corrispondente.
- Le texture (kraft, flute, cemento, legno) sono generate proceduralmente all'avvio: nessun file esterno da scaricare.
- Controllo collisioni: nella console del browser `window.__audit()` elenca le compenetrazioni fra bounding box (ratio = frazione del volume del pezzo più piccolo); `window.__hero.pose(t)` porta la scena al tempo `t` della timeline (in altezze di viewport) senza scrollare, per ispezionare una fase.
- Tutti i pannelli macchina usano spigoli smussati (`box()` in `js/hero/util.js`); carta, cartone e film usano `flatBox()` perché sono davvero a spigolo vivo.
