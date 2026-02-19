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

## Production Deployment (Vercel)

Production URL: `play.bahhos.de`
Deployment: Automatisch via Vercel bei Git push.
