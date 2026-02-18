import { GetOfficialSongIdMessageComposer, MusicPriorities, OfficialSongIdMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetConfiguration, GetNitroInstance, LocalizeText, SendMessageComposer } from '../../../../../api';
import { Button } from '../../../../ui/button';
import { useCatalog, useMessageEvent } from '../../../../../hooks';
import { CatalogHeaderView } from '../../catalog-header/CatalogHeaderView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutSoundMachineView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
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

            if(id > 0)
            {
                setSongId(id);
            }
            else
            {
                setOfficialSongId(product.extraParam);
                SendMessageComposer(new GetOfficialSongIdMessageComposer(product.extraParam));
            }
        }
        else
        {
            setOfficialSongId('');
            setSongId(-1);
        }

        return () => GetNitroInstance().soundManager.musicController?.stop(MusicPriorities.PRIORITY_PURCHASE_PREVIEW);
    }, [ currentOffer ]);

    useEffect(() =>
    {
        return () => GetNitroInstance().soundManager.musicController?.stop(MusicPriorities.PRIORITY_PURCHASE_PREVIEW);
    }, []);

    return (
        <div className="flex flex-col h-full gap-2">
            { GetConfiguration('catalog.headers') &&
                <CatalogHeaderView imageUrl={ currentPage.localization.getImage(0) }/> }
            { currentOffer && songId > -1 &&
                <div className="shrink-0">
                    <Button size="sm" onClick={ () => previewSong(songId) }>{ LocalizeText('play_preview_button') }</Button>
                </div> }
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
