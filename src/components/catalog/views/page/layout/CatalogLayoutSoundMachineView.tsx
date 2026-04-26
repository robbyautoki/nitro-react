import { GetOfficialSongIdMessageComposer, MusicPriorities, OfficialSongIdMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Play, Music } from 'lucide-react';
import { GetConfiguration, GetNitroInstance, LocalizeText, SendMessageComposer } from '../../../../../api';
import * as AlignButton from '@/align-ui/components/ui/button';
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
                <div className="shrink-0 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-2 flex items-center gap-2">
                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="gap-1.5 text-label-xs" onClick={ () => previewSong(songId) }>
                        <Play className="w-3 h-3" /> Vorschau
                    </AlignButton.Root>
                    <Music className="w-3.5 h-3.5 text-text-soft-400" />
                    <span className="text-paragraph-xs text-text-soft-400">{ currentOffer.localizationName }</span>
                </div>
            ) }
            <div className="flex-1 min-h-0 overflow-auto p-3">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
