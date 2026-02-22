import { FC } from 'react';

export const DisconnectOverlayView: FC<{}> = () =>
{
    const handleReload = () => window.location.reload();
    const handleHome = () => { window.location.href = 'https://www.bahhos.de'; };

    return (
        <div className="nitro-disconnect-overlay">
            <div className="disconnect-box">
                <div className="disconnect-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <line x1="12" y1="20" x2="12.01" y2="20" />
                    </svg>
                </div>
                <div className="disconnect-title">Verbindung verloren</div>
                <div className="disconnect-message">Der Server wurde möglicherweise neu gestartet oder ist nicht erreichbar.</div>
                <div className="disconnect-buttons">
                    <button className="disconnect-btn-primary" onClick={ handleReload }>
                        Neu laden
                    </button>
                    <button className="disconnect-btn-secondary" onClick={ handleHome }>
                        Zur Startseite
                    </button>
                </div>
            </div>
        </div>
    );
}
