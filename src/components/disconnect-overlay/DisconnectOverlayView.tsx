import { FC } from 'react';
import { Home, RefreshCw, WifiOff } from 'lucide-react';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';

export const DisconnectOverlayView: FC<{}> = () =>
{
    const handleReload = () => window.location.reload();
    const handleHome = () => { window.location.href = 'https://www.bahhos.de'; };

    return (
        <div className="nitro-disconnect-overlay">
            <AlignSurface.Panel className="disconnect-box">
                <div className="disconnect-icon">
                    <WifiOff className="size-7" />
                </div>
                <div className="disconnect-title">Verbindung verloren</div>
                <div className="disconnect-message">Der Server wurde möglicherweise neu gestartet oder ist nicht erreichbar.</div>
                <div className="disconnect-buttons">
                    <AlignButton.Root type="button" variant="primary" mode="filled" size="medium" className="w-full" onClick={ handleReload }>
                        <AlignButton.Icon as={ RefreshCw } className="size-4" />
                        Neu laden
                    </AlignButton.Root>
                    <AlignButton.Root type="button" variant="neutral" mode="stroke" size="medium" className="w-full" onClick={ handleHome }>
                        <AlignButton.Icon as={ Home } className="size-4" />
                        Zur Startseite
                    </AlignButton.Root>
                </div>
            </AlignSurface.Panel>
        </div>
    );
}
