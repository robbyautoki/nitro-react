import { FC } from 'react';

export const IPhoneFrame: FC = () =>
{
    return (
        <svg
            className="iphone-frame-svg"
            viewBox="0 0 250 504"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="iphone-metallic" x1="0" y1="0" x2="250" y2="504" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#e8e8ed" />
                    <stop offset="25%" stopColor="#c8c8d0" />
                    <stop offset="50%" stopColor="#d8d8e0" />
                    <stop offset="75%" stopColor="#b8b8c4" />
                    <stop offset="100%" stopColor="#d0d0d8" />
                </linearGradient>
                <linearGradient id="iphone-edge-highlight" x1="0" y1="0" x2="0" y2="504" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="iphone-screen-bezel" x1="0" y1="0" x2="0" y2="504" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1a1a1e" />
                    <stop offset="100%" stopColor="#0a0a0c" />
                </linearGradient>
            </defs>

            {/* Aeusserer Koerper */}
            <rect x="4" y="0" width="242" height="504" rx="30" ry="30" fill="url(#iphone-metallic)" />

            {/* Kanten-Highlight (Lichtreflex) */}
            <rect x="4" y="0" width="242" height="504" rx="30" ry="30" fill="none" stroke="url(#iphone-edge-highlight)" strokeWidth="1.5" />

            {/* Innerer schwarzer Bezel */}
            <rect x="8" y="4" width="234" height="496" rx="26" ry="26" fill="url(#iphone-screen-bezel)" />

            {/* Screen-Bereich (transparent/cutout) */}
            <rect x="14" y="14" width="222" height="476" rx="20" ry="20" fill="black" />

            {/* Dynamic Island */}
            <rect x="98" y="20" width="54" height="16" rx="8" ry="8" fill="#111113" />

            {/* Kamera-Punkt in Dynamic Island */}
            <circle cx="138" cy="28" r="3.5" fill="#0d0d10" />
            <circle cx="138" cy="28" r="2" fill="#0a1628" opacity="0.8" />

            {/* Linke Seitenbuttons */}
            {/* Stumm-Schalter */}
            <rect x="0" y="100" width="4" height="18" rx="2" ry="2" fill="#b0b0b8" />
            {/* Lautstaerke hoch */}
            <rect x="0" y="140" width="4" height="32" rx="2" ry="2" fill="#b0b0b8" />
            {/* Lautstaerke runter */}
            <rect x="0" y="182" width="4" height="32" rx="2" ry="2" fill="#b0b0b8" />

            {/* Rechter Seitenbutton (Power) */}
            <rect x="246" y="155" width="4" height="44" rx="2" ry="2" fill="#b0b0b8" />

            {/* Aeusserer Rahmen-Schatten */}
            <rect x="4" y="0" width="242" height="504" rx="30" ry="30" fill="none" stroke="#888890" strokeWidth="0.5" />
        </svg>
    );
}
