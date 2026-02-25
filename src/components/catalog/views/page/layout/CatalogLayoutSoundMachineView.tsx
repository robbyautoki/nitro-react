import { GetOfficialSongIdMessageComposer, MusicPriorities, OfficialSongIdMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Play, Music } from 'lucide-react';
import { GetConfiguration, GetNitroInstance, LocalizeText, SendMessageComposer } from '../../../../../api';
import { Button } from '../../../../ui/button';
import { useCatalog, useMessageEvent } from '../../../../../hooks';
import { CatalogPageHeaderBanner } from '../../shared/CatalogPageHeaderBanner';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutSoundMachineView: FC<CatalogLayoutProps> = props =>
{
    const [ songId, setSongId ] = useState(-1);
    const [ officialSongId, setOfficialSongId ] = useState('');
    const { currentOffer = null, currentPage = null } = useCatalog();

    const previewSong = (previewSongId: number) => GetNitroInstance().soundManager.musicController?.playSong(previewSongId, MusicPriorities.PRIORITY_PURCHASE_PREVIEW, 15, 0, 0, 0);

    useMessageEvent<OfficialSongIdMessageEvent>(OfficialSongIdMessageEvent, event =>
    {
        const parser = event.getParser();
        if(parser.officialSongId !== officialSongId) return;
        setSongId(parser.songId);
    });

    useEffect(() =>
    {
        if(!currentOffer) return;
        const product = currentOffer.product;
        if(!product) return;

        if(product.extraParam.length > 0)
        {
            const id = parseInt(product.extraParam);
            if(id > 0) setSongId(id);
            else { setOfficialSongId(product.extraParam); SendMessageComposer(new GetOfficialSongIdMessageComposer(product.extraParam)); }
        }
        else { setOfficialSongId(''); setSongId(-1); }

        return () => GetNitroInstance().soundManager.musicController?.stop(MusicPriorities.PRIORITY_PURCHASE_PREVIEW);
    }, [ currentOffer ]);

    useEffect(() =>
    {
        return () => GetNitroInstance().soundManager.musicController?.stop(MusicPriorities.PRIORITY_PURCHASE_PREVIEW);
    }, []);

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            <CatalogPageHeaderBanner />
            { currentOffer && songId > -1 && (
                <div className="shrink-0 px-4 py-2 border-b border-border/20 flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]" onClick={ () => previewSong(songId) }>
                        <Play className="w-3 h-3" /> Vorschau
                    </Button>
                    <Music className="w-3.5 h-3.5 text-muted-foreground/40" />
                    <span className="text-[11px] text-muted-foreground/50">{ currentOffer.localizationName }</span>
                </div>
            ) }
            <div className="flex-1 min-h-0 overflow-auto p-3">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
