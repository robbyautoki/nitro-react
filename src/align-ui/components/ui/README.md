# AlignUI Components — nitro-react Port

Lokaler Port der AlignUI-Base-Komponenten in `nitro-react`. Standard für **alle**
neuen Panels, Modals, Drawer, Toolbars und Widgets im Habbo-Client.

**Quelle:** `/Users/robbyreinemann/Desktop/AlignUI-Kit`
**Tokens:** definiert in `src/tailwind.css` (Tailwind 4 + `@tailwindcss/postcss`,
`@theme inline { --align-* … }`). Primary ist Bahhos-Orange.
**`cn` Util:** `src/align-ui/utils/cn.ts` (clsx + extendTailwindMerge mit
`rounded-10/12/16/20`, `text-title-h*`, `text-label-*`, `text-paragraph-*`,
`shadow-regular-*` registriert).
**Hooks:** `src/align-ui/hooks/use-tab-observer.ts`.

## Verfügbare Komponenten

| Datei | Import-Pfad | Wichtigste Exports |
|-------|-------------|--------------------|
| `alert.tsx` | `@/align-ui/components/ui/alert` | `Root`, `Icon` |
| `avatar.tsx` | `@/align-ui/components/ui/avatar` | `Root`, `Image`, `Fallback`, `Indicator`, `Status` |
| `avatar-empty-icons.tsx` | `@/align-ui/components/ui/avatar-empty-icons` | Empty-State Icons |
| `badge.tsx` | `@/align-ui/components/ui/badge` | `Root`, `Icon`, `Dot` |
| `button.tsx` | `@/align-ui/components/ui/button` | `Root`, `Icon` |
| `checkbox.tsx` | `@/align-ui/components/ui/checkbox` | `Root` |
| `color-picker.tsx` | `@/align-ui/components/ui/color-picker` | `Root` |
| `compact-button.tsx` | `@/align-ui/components/ui/compact-button` | `Root`, `Icon` |
| `divider.tsx` | `@/align-ui/components/ui/divider` | `Root` |
| `drawer.tsx` | `@/align-ui/components/ui/drawer` | Radix Drawer Wrapper |
| `fancy-button.tsx` | `@/align-ui/components/ui/fancy-button` | `Root`, `Icon` (variants: neutral, primary, destructive, basic) |
| `input.tsx` | `@/align-ui/components/ui/input` | `Root`, `Wrapper`, `Icon` |
| `link-button.tsx` | `@/align-ui/components/ui/link-button` | `Root`, `Icon` |
| `modal.tsx` | `@/align-ui/components/ui/modal` | `Root`, `Trigger`, `Close`, `Portal`, `Overlay`, `Content`, `Header`, `Title`, `Description`, `Body`, `Footer` |
| `popover.tsx` | `@/align-ui/components/ui/popover` | `Root`, `Trigger`, `Content`, `Anchor`, `Close` |
| `progress-bar.tsx` | `@/align-ui/components/ui/progress-bar` | `Root` |
| `segmented-control.tsx` | `@/align-ui/components/ui/segmented-control` | `Root`, `List`, `Trigger`, `Content` |
| `select.tsx` | `@/align-ui/components/ui/select` | `Root`, `Trigger`, `Value`, `Content`, `Item`, `Group` … |
| `slider.tsx` | `@/align-ui/components/ui/slider` | `Root` |
| `surface.tsx` | `@/align-ui/components/ui/surface` | `Root` |
| `switch.tsx` | `@/align-ui/components/ui/switch` | `Root` |
| `tab-menu-horizontal.tsx` | `@/align-ui/components/ui/tab-menu-horizontal` | `Root`, `List`, `Trigger`, `Content` |
| `table.tsx` | `@/align-ui/components/ui/table` | `Root`, `Header`, `Body`, `Row`, `Head`, `Cell` |
| `tag.tsx` | `@/align-ui/components/ui/tag` | `Root`, `Icon`, `DismissButton` |
| `textarea.tsx` | `@/align-ui/components/ui/textarea` | `Root` |
| `tooltip.tsx` | `@/align-ui/components/ui/tooltip` | `Provider`, `Root`, `Trigger`, `Content` |

## Verwendung

```tsx
import * as Modal from '@/align-ui/components/ui/modal';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

<Modal.Root open={open} onOpenChange={setOpen}>
    <Modal.Content className="max-w-[360px]">
        <Modal.Header title="Befehl senden?" description="…" />
        <Modal.Footer>
            <FancyButton.Root variant="basic" size="small" onClick={onCancel}>Abbrechen</FancyButton.Root>
            <FancyButton.Root variant="primary" size="small" onClick={onConfirm}>OK</FancyButton.Root>
        </Modal.Footer>
    </Modal.Content>
</Modal.Root>
```

## Strikte Regeln

1. **Nur diese Komponenten** für neue UI verwenden (KEIN shadcn-Mix, KEIN
   `NitroCardView` für neue Flächen).
2. **Keine hardcoded Farben.** Nur AlignUI-Tokens (`bg-bg-white-0`,
   `text-text-strong-950`, `ring-stroke-soft-200`, `text-primary-base`, …).
   Dark-Mode kommt automatisch über die `.dark`-Variante in `tailwind.css`.
3. **Eigene Erweiterungen** dürfen nur auf diesen Base-Komponenten aufbauen.
   Wenn eine AlignUI-Komponente fehlt: aus dem AlignUI-Kit portieren und hier
   ablegen — nicht aus shadcn ergänzen.
4. **Pflicht-Header** in neuen AlignUI-Views:
   ```ts
   // STRIKT AlignUI ONLY:
   //   • Quelle: /Users/robbyreinemann/Desktop/AlignUI-Kit
   //   • Komponenten ausschließlich aus `@/align-ui/components/ui/*`
   //   • KEIN shadcn/ui, KEIN Glassmorphism, KEIN NitroCardView
   ```

## Referenz-Views in dieser Codebase

- `src/components/room/widgets/avatar-info/AvatarInfoPetTrainingPanelView.tsx`
- `src/components/align-game-ui/AlignGameConfirm.tsx`
- `src/components/welcome/WelcomeDialogView.tsx`
- `src/components/jail/JailEnterpriseEffectsView.tsx`
- `src/components/marketplace/CustomMarketplaceBrowseView.tsx`
