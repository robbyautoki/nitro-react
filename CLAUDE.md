# nitro-react - Habbo HTML5 Client Frontend

## Stack
- Vite 4 + React 18 + TypeScript 4 + Tailwind 3 + SCSS
- `@nitrots/nitro-renderer` - Habbo game engine (WebGL, protocol, assets)
- Radix UI Primitives + shadcn/ui Komponenten
- Alias: `@` → `src/`, `~` → `node_modules/`

## Befehle

```bash
yarn start          # Dev-Server
yarn build          # Production Build → dist/
yarn eslint         # Linting
```

Der Production-Build wird automatisch beim `docker compose up -d --build client` getriggert.

## Verzeichnisstruktur (`src/`)

```
src/
├── App.tsx                 # Root: Nitro Init, Loading, Routing
├── api/                    # Emulator-Kommunikation (Packets, Composers)
├── common/                 # Basis-Komponenten (Base, Button, etc.)
├── components/             # UI Panels (32 Komponenten)
├── events/                 # Nitro Event Definitionen
├── hooks/                  # React Hooks (useMainEvent, useRoomEngineEvent, ...)
├── workers/                # Web Workers
└── lib/                    # Utilities
```

## Komponenten-Übersicht (`src/components/`)

achievements, avatar-editor, camera, campaign, catalog, chat-history,
floorplan-editor, friends, game-center, groups, guide-tool, hc-center,
help, hotel-view, inventory, loading, main, mod-tools, navigator,
nitropedia, notification-center, purse, right-side, room, toolbar,
ui, user-profile, user-settings, **wired**

**wired** enthält die Custom Wired Views (AI Message, Random Chance).

## Custom Client Dateien (`/client/custom/`)

Diese Dateien liegen in `client/custom/` (nicht hier) und werden beim Docker-Build in den richtigen Ordner kopiert:

| Datei                              | Ziel in src/                              |
|------------------------------------|-------------------------------------------|
| `MovingObjectLogic.ts`             | `api/nitro/...`                           |
| `WiredActionAiMessageView.tsx`     | `components/wired/views/actions/`         |
| `WiredActionLayoutCode.ts`         | `components/wired/...`                    |
| `WiredActionLayoutView.tsx`        | `components/wired/views/actions/`         |
| `WiredConditionLayoutCode.ts`      | `components/wired/...`                    |
| `WiredConditionLayoutView.tsx`     | `components/wired/views/conditions/`      |
| `WiredConditionRandomChanceView.tsx` | `components/wired/views/conditions/`    |

## App-Init Flow

1. `Nitro.bootstrap()` - Engine starten
2. `core.configuration.init()` - renderer-config.json laden
3. `localization.init()` → Assets preloaden → `GetCommunication().init()`
4. WebSocket Handshake → Auth → `GetNitroInstance().init()`
5. `RoomEngineEvent.ENGINE_INITIALIZED` → `setIsReady(true)` → `MainView` rendern

## Neues UI Panel hinzufügen

1. Verzeichnis `src/components/mein-panel/` anlegen
2. `MeinPanelView.tsx` + `index.ts` + SCSS + Hook
3. In `src/components/main/MainView.tsx` importieren und rendern
4. Ggf. Event in `src/events/` + Hook in `src/hooks/`

## Build Output

`dist/` wird via `client/Dockerfile` in nginx-Image kopiert und auf Port 3080 served.
`client/config/*.json` werden zur Laufzeit gemountet (kein rebuild nötig für Config).

## AlignUI Strict (KRITISCH für neue UI)

**Quelle:** `/Users/robbyreinemann/Desktop/AlignUI-Kit`
**Lokale Komponenten:** `src/align-ui/components/ui/*` — siehe `src/align-ui/components/ui/README.md`
**Tokens:** in `src/tailwind.css` als `@theme inline` definiert (Tailwind 4 + `@tailwindcss/postcss`).
Primary ist auf Bahhos-Orange `oklch(...)` gemappt — nicht das AlignUI-Default-Grün.

**Regeln für neue Panels / Widgets / Modals / Toolbars:**
1. NUR Komponenten aus `@/align-ui/components/ui/*` verwenden — z.B. `Modal`, `FancyButton`, `SegmentedControl`, `Badge`, `Divider`, `CompactButton`, `Tooltip`.
2. KEIN shadcn/ui für neue Flächen. Bestehende shadcn-Flächen bleiben Legacy, werden bei Touch durch AlignUI ersetzt.
3. KEIN `NitroCardView` (Habbo-Frame) für neue UI. Floating-Cards: `bg-bg-white-0 rounded-20 shadow-regular-md ring-1 ring-stroke-soft-200`.
4. KEIN Glassmorphism (Backdrop-Blur als Default-Optik), kein hardcoded `#fff`/`#000`.
5. Eigenständige Erweiterungen MÜSSEN auf AlignUI-Base bauen (`src/align-ui/components/ui/*`). Nicht aus dem Kit kopieren — den Port hier nutzen oder erweitern.
6. Tailwind-Tokens ausschließlich aus dem AlignUI-Namespace: `text-text-strong-950`, `bg-bg-weak-50`, `text-text-sub-600`, `ring-stroke-soft-200`, `bg-primary-alpha-10`, `text-primary-base`, `shadow-regular-md`, `rounded-10/12/16/20`. Custom-Werte sind in `tailwind.css` und in `src/align-ui/utils/cn.ts` (`twMergeConfig`) registriert.

**Pflicht-Header-Kommentar bei neuen AlignUI-Views:**
```ts
// STRIKT AlignUI ONLY:
//   • Quelle: /Users/robbyreinemann/Desktop/AlignUI-Kit
//   • Komponenten ausschließlich aus `@/align-ui/components/ui/*`
//   • KEIN shadcn/ui, KEIN Glassmorphism, KEIN NitroCardView
```

**Referenz-Implementierungen:**
- `src/components/room/widgets/avatar-info/AvatarInfoPetTrainingPanelView.tsx` (Floating-Card + SegmentedControl + Modal)
- `src/components/align-game-ui/AlignGameConfirm.tsx` (Confirm-Modal + FancyButton)
- `src/components/welcome/WelcomeDialogView.tsx`
- `src/components/jail/JailEnterpriseEffectsView.tsx`

## Theming / Dark Mode (KRITISCH)

Der Client nutzt **shadcn/ui + Tailwind** mit Dark-Mode via `.dark` Klasse auf `<html>`.
Toggle: `ToolbarView.tsx` → `document.documentElement.classList.toggle('dark')`.

**Regeln:**
1. NIEMALS hardcoded Farben (`#fff`, `#000`, `rgba(...)`) für Hintergrund oder Text verwenden
2. IMMER shadcn CSS-Variablen nutzen die automatisch Light/Dark switchen:
   - Hintergrund: `oklch(var(--card))`, `oklch(var(--background))`, `oklch(var(--popover))`
   - Text: `oklch(var(--card-foreground))`, `oklch(var(--foreground))`
   - Muted: `oklch(var(--muted))`, `oklch(var(--muted-foreground))`
   - Accent: `oklch(var(--accent))`, `oklch(var(--accent-foreground))`
3. In Tailwind-Klassen: `bg-card`, `text-card-foreground`, `bg-background`, `text-foreground`
4. In SCSS: `background-color: oklch(var(--card));` / `color: oklch(var(--card-foreground));`
5. Variablen definiert in `src/tailwind.css` (`:root` = light, `.dark` = dark)

## Production Deployment (Vercel)

Production URL: `play.bahhos.de`
Deployment: Automatisch via Vercel bei Git push.
