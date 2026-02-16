import { GetOfficialSongIdMessageComposer, MusicPriorities, OfficialSongIdMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetConfiguration, GetNitroInstance, LocalizeText, ProductTypeEnum, SendMessageComposer } from '../../../../../api';
import { Button, Flex, LayoutImage } from '../../../../../common';
import { useCatalog, useMessageEvent } from '../../../../../hooks';
import { CatalogHeaderView } from '../../catalog-header/CatalogHeaderView';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLimitedItemWidgetView } from '../widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from '../widgets/CatalogSpinnerWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
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
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
            { currentOffer ? (
                <div className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 shrink-0">
                    <div className="w-[100px] h-[80px] shrink-0 rounded-md bg-white border border-zinc-100 overflow-hidden">
                        <Flex center className="w-full h-full">
                            { (currentOffer.product.productType !== ProductTypeEnum.BADGE) &&
                                <>
                                    <CatalogViewProductWidgetView />
                                    <CatalogAddOnBadgeWidgetView className="bg-muted rounded bottom-1 end-1" />
                                </> }
                            { (currentOffer.product.productType === ProductTypeEnum.BADGE) && <CatalogAddOnBadgeWidgetView className="scale-2" /> }
                        </Flex>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <CatalogLimitedItemWidgetView fullWidth />
                        <span className="text-sm font-medium text-zinc-900 truncate">{ currentOffer.localizationName }</span>
                        { songId > -1 && <Button size="sm" onClick={ () => previewSong(songId) }>{ LocalizeText('play_preview_button') }</Button> }
                        <div className="flex items-center gap-2">
                            <CatalogSpinnerWidgetView />
                            <div className="flex-1" />
                            <CatalogTotalPriceWidget justifyContent="end" alignItems="end" />
                        </div>
                        <CatalogPurchaseWidgetView />
                    </div>
                </div>
            ) : (
                <div className="catalog-page-text flex flex-col items-center gap-2 p-3 text-center shrink-0">
                    { !!page.localization.getImage(1) && <LayoutImage imageUrl={ page.localization.getImage(1) } /> }
                    { /* Server localization text (trusted content from game server) */ }
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                </div>
            ) }
        </div>
    );
}
