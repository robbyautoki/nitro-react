import { FC } from 'react';

export const DisconnectOverlayView: FC<{}> = () =>
{
    const handleReload = () => window.location.reload();

    return (
        <div className="nitro-disconnect-overlay">
            <div className="disconnect-box">
                <div className="disconnect-title">Verbindung zum Hotel verloren</div>
                <div className="disconnect-message">Der Server wurde möglicherweise neu gestartet oder ist nicht erreichbar.</div>
                <button className="disconnect-button" onClick={ handleReload }>Hotel neu laden</button>
            </div>
        </div>
    );
}
