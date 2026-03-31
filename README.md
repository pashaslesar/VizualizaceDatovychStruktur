# Visual DS — Interaktivní vizualizace datových struktur

*Autor: Anastasiia Faleeva*  
*Téma: Interaktivní krok-za-krokem animace operací nad klasickými datovými strukturami*

---

## 🎯 Executive Summary

**Výzva:** Vytvořit webovou aplikaci, která vizuálně a srozumitelně demonstruje vnitřní chování datových struktur — vkládání, mazání, procházení a vyhledávání — tak, aby student pochopil každý krok algoritmu.

**Řešení:** Postavena single-page architektura s vlastním animačním frameworkem postaveným na SVG a systému snímků (frames). Každá operace generuje sekvenci snímků popisujících stav struktury; Timeline je přehrává se zvolenou rychlostí a plynulou interpolací mezi snímky. Výsledkem je animace, kde lze zastavit, přetáčet dopředu/dozadu a měnit rychlost.

**Klíčové technologie:** TypeScript · Vite · SVG · rolldown-vite · GitHub Actions · GitHub Pages

**Výsledky projektu:**

- ✅ **5 plně funkčních** datových struktur s animacemi operací
- ✅ **Nulové runtime závislosti** — čistý TypeScript/SVG bez knihoven
- ✅ **Plynulé animace** díky vlastnímu interpolačnímu enginu (lerp mezi snímky)
- ✅ **Responzivní design** + podpora mobilních zařízení (pinch-to-zoom)
- ✅ **Automatický deployment** přes GitHub Actions na GitHub Pages

---

## 📊 Přehled implementovaných struktur

| Struktura | Operace | Speciální funkce |
|---|---|---|
| **Linked List** | Vložení/mazání na začátek a konec, hledání hodnoty | Singly / Doubly / Doubly-cyclic; layout linka nebo kruh |
| **Stack** | Push, Pop, Peek Top, Peek Bottom | Odznaky TOP/BOTTOM, detekce přetečení, indexy prvků |
| **Queue** | Enqueue, Dequeue, Peek Front | Odznaky FRONT/REAR, indexy prvků, limit fronty |
| **Array** | Set, Insert, Remove, Find, Resize | Indexy nad buňkami, dynamická kapacita (max 12) |
| **BST** | Vložení, mazání, hledání, průchody DFS/BFS | Stromový layout, odznak ROOT, výpis pořadí průchodu |

---

## 🏗️ Architektura

Projekt je postaven na třech oddělených vrstvách:

```
┌─────────────────────────────────────────────┐
│           DSoperations (logika)             │
│  Generují Frame[] — stavy datové struktury  │
└────────────────────┬────────────────────────┘
                     │ Frame[]
┌────────────────────▼────────────────────────┐
│           Timeline (animační engine)        │
│  Přehrávání, pauza, krok, interpolace       │
└────────────────────┬────────────────────────┘
                     │ render(frame) / renderLerp(a,b,t)
┌────────────────────▼────────────────────────┐
│           Renderer (SVG vizualizace)        │
│  Uzly, hrany, odznaky, layout               │
└─────────────────────────────────────────────┘
```

### Tok dat při operaci (příklad: Stack Push)

1. Uživatel klikne na tlačítko **Push**
2. `StackOperations.push(value)` vrátí `Frame[]` — sekvenci vizuálních stavů
3. `Timeline.append(frames)` přidá snímky a spustí přehrávání
4. Pro každý snímek se volá `renderer.render(frame)` nebo `renderer.renderLerp(a, b, t)`
5. Renderer aktualizuje SVG uzly, hrany a odznaky

---

## 📁 Struktura projektu

```
vizualizace/
├── index.html                    # Hlavní stránka s kartami struktur
├── vite.config.ts                # Vite konfigurace, multi-page build
├── tsconfig.json
│
├── pages/                        # HTML stránky + CSS pro každou strukturu
│   ├── styles.css                # Globální téma (dark mode, barvy, tlačítka)
│   ├── layout.css                # Layout sidebar + stage, player ovládání, zoom
│   ├── linkedlist.html
│   ├── stack.html / stack.css    # Zelená téma
│   ├── queue.html / queue.css    # Žlutá téma
│   ├── array.html / array.css    # Žlutá téma
│   └── BST.html / bst.css        # Zelená téma
│
└── src/
    ├── home.ts                   # Hledání karet na hlavní stránce (název / štítky)
    │
    ├── core/
    │   ├── types.ts              # NodeState, EdgeState, Frame, LayoutType
    │   ├── Timeline.ts           # Animační engine — play/pause/next/prev/lerp
    │   └── zoom.ts               # Zoom 50–150 %, Ctrl+/−, pinch-to-zoom
    │
    ├── DSstructures/             # Entry pointy HTML stránek
    │   ├── linkedlist.ts
    │   ├── stack.ts
    │   ├── queue.ts
    │   ├── array.ts
    │   └── bst.ts
    │
    ├── DSoperations/             # Logika datových struktur → generování Frame[]
    │   ├── LinkedListOperations.ts
    │   ├── StackOperations.ts
    │   ├── QueueOperations.ts
    │   ├── ArrayOperations.ts
    │   └── BstOperations.ts
    │
    └── render/                   # SVG renderery
        ├── base/
        │   └── BaseSvgRenderer.ts   # Abstraktní základ: uzly, hrany, odznaky, lerp
        ├── LinkedListRenderer.ts
        ├── StackRenderer.ts         # TOP/BOTTOM odznaky + indexy
        ├── QueueRenderer.ts         # FRONT/REAR odznaky + indexy
        ├── ArrayRenderer.ts         # Indexy nad buňkami
        └── BstRenderer.ts           # ROOT odznak
```

---

## ⚙️ Klíčové technické řešení

### Frame-based animace
Každá operace vrací `Frame[]` — pole diskrétních stavů. `Timeline` je přehrává za sebou s nastavitelnou rychlostí. Mezi sousedními snímky probíhá **lineární interpolace** (lerp) pozic uzlů, takže pohyb je plynulý. Snímky mohou mít vlastní `durationMs` (např. blikání při Peek trvá 70 ms).

```typescript
// Příklad: Stack push generuje 3 snímky
push(value: number): Frame[] {
    // 1. Výchozí stav
    // 2. Nový prvek jako TOP (zvýrazněný)
    // 3. Výsledný stav
}
```

### Systém odznaků (badges)
`BaseSvgRenderer` obsahuje generický systém pro zobrazení textových odznaků (HEAD, TAIL, TOP, BOTTOM, FRONT, REAR, ROOT) přímo uvnitř SVG uzlu. Odznaky jsou SVG `<g>` elementy s `<rect>` a `<text>`, jejich viditelnost se mění per-snímek.

### Zoom
Modul `zoom.ts` přidá do každé stránky tlačítka `−` / `%` / `+` do ovládacího pruhu. Při přiblížení se nastaví explicitní `width`/`height` na SVG elementu — kontejner má `overflow-x: auto`, takže se zobrazí horizontální scrollbar.

---

## 🚀 Spuštění projektu

```bash
# Instalace závislostí
npm install

# Vývojový server (http://localhost:5173)
npm run dev

# Produkční build (výstup do /dist)
npm run build

# Náhled produkčního buildu
npm run preview
```

### Deployment (GitHub Actions)

Projekt se automaticky nasadí na GitHub Pages při každém push do větve `main`:

```yaml
# .github/workflows/deploy.yml
- run: npm ci
- run: npm run build        # Vite multi-page build
- uses: actions/upload-pages-artifact@v3
  with:
    path: ./dist
```

Produkční base URL: `/VizualizaceDatovychStruktur/` (nastaveno v `vite.config.ts`)

---

## 🎨 Design systém

Projekt používá **dark mode** s dvěma barevnými tématy:

| Téma | Použito pro | Primární barva |
|---|---|---|
| `theme-green` | Stack, BST, Linked List | `#39d98a` |
| `theme-orange` | Queue, Array | `#ffb64d` |

CSS proměnné `--primary`, `--hl-stroke`, `--hl-fill` přebírají barvu z aktivního tématu, takže renderery jsou na tématu nezávislé.

---

## 📦 Závislosti

**Runtime:** žádné (0 závislostí)

**Vývojové:**

| Balíček | Verze | Účel |
|---|---|---|
| `typescript` | ~5.9.3 | Typová kontrola |
| `rolldown-vite` | 7.x | Build nástroj, dev server, multi-page |
| `@types/node` | — | Node.js typy pro Vite konfiguraci |
