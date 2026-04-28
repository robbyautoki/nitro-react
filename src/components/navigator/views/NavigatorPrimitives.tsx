import { ButtonHTMLAttributes, ComponentType, FC, HTMLAttributes, ImgHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignTextarea from '@/align-ui/components/ui/textarea';
import { cn } from '@/align-ui/utils/cn';

// ── Habbo-Pixel-Icon (z. B. /navigator/icons/user.png) mit pixelated rendering ──
interface PixelIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>
{
    src: string;
    size?: string;
    alt?: string;
}

export const PixelIcon: FC<PixelIconProps> = ({ src, size = 'size-3', alt = '', className, style, ...rest }) => (
    <img
        src={ src }
        alt={ alt }
        className={ cn(size, 'shrink-0', className) }
        style={ { imageRendering: 'pixelated', ...(style || {}) } }
        loading="lazy"
        { ...rest }
    />
);

// ── Factory: erzeugt eine ComponentType-kompatible Pixel-Icon-Komponente ──
// Nötig damit AlignButton.Icon / AlignTabMenu.Icon / AlignInput.Icon / AlignBadge.Icon
// (die alle `as: ComponentType` erwarten) Habbo-Pixel-Bilder rendern können.
function makePixelIconComponent(src: string, alt = ''): FC<{ className?: string }>
{
    const C: FC<{ className?: string }> = ({ className }) => (
        <img
            src={ src }
            alt={ alt }
            className={ cn('shrink-0', className) }
            style={ { imageRendering: 'pixelated' } }
            loading="lazy"
        />
    );
    C.displayName = `PixelIcon(${ src })`;
    return C;
}

// Generische UI-Icons
export const NavCloseIcon       = makePixelIconComponent('/navigator/icons/close.png', 'Schließen');
export const NavRefreshIcon     = makePixelIconComponent('/navigator/icons/loading-icon.png', 'Aktualisieren');
export const NavPlusIcon        = makePixelIconComponent('/navigator/icons/add.png', 'Hinzufügen');
export const NavCheckIcon       = makePixelIconComponent('/navigator/icons/tick.png', 'OK');
export const NavSearchIcon      = makePixelIconComponent('/navigator/icons/zoom-more.png', 'Suche');

// Navigator-spezifisch
export const NavRoomsIcon       = makePixelIconComponent('/navigator/icons/rooms.png', 'Räume');
export const NavOfficialIcon    = makePixelIconComponent('/navigator/icons/official.png', 'Offiziell');
export const NavCrownIcon       = makePixelIconComponent('/navigator/icons/owner-crown.png', 'Besitzer');
export const NavHomeIcon        = makePixelIconComponent('/navigator/icons/house.png', 'Home');

// Room-Info
export const NavSettingsIcon    = makePixelIconComponent('/navigator/icons/cog.png', 'Einstellungen');
export const NavLinkIcon        = makePixelIconComponent('/navigator/icons/room-link.png', 'Link');
export const NavCameraIcon      = makePixelIconComponent('/navigator/icons/camera-small.png', 'Kamera');
export const NavUserIcon        = makePixelIconComponent('/navigator/icons/user.png', 'User');
export const NavChatIcon        = makePixelIconComponent('/navigator/icons/chat.png', 'Chat');
export const NavWarningIcon     = makePixelIconComponent('/navigator/icons/warning.png', 'Warnung');
export const NavShieldIcon      = makePixelIconComponent('/navigator/icons/admin-shield.png', 'Mod');
export const NavTrashIcon       = makePixelIconComponent('/navigator/icons/sign-skull.png', 'Löschen');

// Sections / Marker
export const NavSparkleIcon     = makePixelIconComponent('/navigator/icons/sign-yellow.png', 'Spotlight');
export const NavFlameIcon       = makePixelIconComponent('/navigator/icons/sign-red.png', 'Hot');
export const NavTrendingIcon    = makePixelIconComponent('/navigator/icons/sign-exclamation.png', 'Trending');
export const NavHistoryIcon     = makePixelIconComponent('/navigator/icons/chat-history.png', 'Verlauf');
export const NavBackIcon        = makePixelIconComponent('/navigator/icons/arrows.png', 'Zurück');

// ── Pixel-Sterne-Skala (5 like-room.png nebeneinander, leere mit opacity-25) ──
interface PixelStarsProps
{
    rating: number;
    size?: string;
    className?: string;
}

export const PixelStars: FC<PixelStarsProps> = ({ rating, size = 'size-4', className }) => (
    <div className={ cn('flex items-center gap-0.5', className) }>
        { [ 1, 2, 3, 4, 5 ].map(i => (
            <img
                key={ i }
                src="/navigator/icons/like-room.png"
                alt={ i <= rating ? '★' : '☆' }
                className={ cn(size, 'shrink-0', i <= rating ? 'opacity-100' : 'opacity-25 grayscale') }
                style={ { imageRendering: 'pixelated' } }
                loading="lazy"
            />
        )) }
    </div>
);

export function NavigatorPanelStack({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return <div className={ cn('flex w-full flex-col gap-2', className) } { ...props } />;
}

export function NavigatorPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return (
        <div
            className={ cn(
                'rounded-xl bg-bg-white-0 p-3 text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200',
                className
            ) }
            { ...props }
        />
    );
}

export function NavigatorScrollViewport({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return <div className={ cn('min-h-0 overflow-y-auto', className) } { ...props } />;
}

interface NavigatorTextInputProps extends InputHTMLAttributes<HTMLInputElement>
{
    icon?: ComponentType<{ className?: string }>;
    rootClassName?: string;
    wrapperClassName?: string;
}

export function NavigatorTextInput({ icon: Icon, rootClassName, wrapperClassName, className, ...props }: NavigatorTextInputProps)
{
    return (
        <AlignInput.Root size="xsmall" className={ rootClassName }>
            <AlignInput.Wrapper className={ cn('h-8', wrapperClassName) }>
                { Icon && <AlignInput.Icon as={ Icon } className="size-3.5" /> }
                <AlignInput.Input className={ cn('h-8 text-paragraph-xs', className) } { ...props } />
            </AlignInput.Wrapper>
        </AlignInput.Root>
    );
}

export function NavigatorTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>)
{
    return <AlignTextarea.Root simple className={ cn('text-paragraph-xs', className) } { ...props } />;
}

interface NavigatorTabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>
{
    active?: boolean;
    children: ReactNode;
}

export function NavigatorTabButton({ active = false, className, children, ...props }: NavigatorTabButtonProps)
{
    return (
        <button
            type="button"
            className={ cn(
                'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-label-xs transition duration-200 ease-out',
                active
                    ? 'bg-primary-base text-static-white shadow-regular-xs'
                    : 'text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950',
                className
            ) }
            { ...props }
        >
            { children }
        </button>
    );
}
