import { GetMarketplaceConfigurationMessageComposer, MakeOfferMessageComposer, MarketplaceConfigurationEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FurnitureItem, LocalizeText, ProductTypeEnum, SendMessageComposer } from '../../../../../../api';
import { LayoutFurniImageView, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../../../../common';
import { CatalogPostMarketplaceOfferEvent } from '../../../../../../events';
import { useCatalog, useMessageEvent, useNotification, useUiEvent } from '../../../../../../hooks';
import { Button } from '../../../../../ui/button';
import { Input } from '../../../../../ui/input';

export const MarketplacePostOfferView : FC<{}> = props =>
{
    const [ item, setItem ] = useState<FurnitureItem>(null);
    const [ askingPrice, setAskingPrice ] = useState(0);
    const [ tempAskingPrice, setTempAskingPrice ] = useState('0');
    const { catalogOptions = null, setCatalogOptions = null } = useCatalog();
    const { marketplaceConfiguration = null } = catalogOptions;
    const { showConfirm = null } = useNotification();

    const updateAskingPrice = (price: string) =>
    {
        setTempAskingPrice(price);

        const newValue = parseInt(price);

        if(isNaN(newValue) || (newValue === askingPrice)) return;

        setAskingPrice(parseInt(price));
    }

    useMessageEvent<MarketplaceConfigurationEvent>(MarketplaceConfigurationEvent, event =>
    {
        const parser = event.getParser();

        setCatalogOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.marketplaceConfiguration = parser;

            return newValue;
        });
    });

    useUiEvent<CatalogPostMarketplaceOfferEvent>(CatalogPostMarketplaceOfferEvent.POST_MARKETPLACE, event => setItem(event.item));

    useEffect(() =>
    {
        if(!item || marketplaceConfiguration) return;

        SendMessageComposer(new GetMarketplaceConfigurationMessageComposer());
    }, [ item, marketplaceConfiguration ]);

    useEffect(() =>
    {
        if(!item) return;

        return () => setAskingPrice(0);
    }, [ item ]);

    if(!marketplaceConfiguration || !item) return null;

    const getFurniTitle = (item ? LocalizeText(item.isWallItem ? 'wallItem.name.' + item.type : 'roomItem.name.' + item.type) : '');
    const getFurniDescription = (item ? LocalizeText(item.isWallItem ? 'wallItem.desc.' + item.type : 'roomItem.desc.' + item.type) : '');

    const getCommission = () => Math.max(Math.ceil(((marketplaceConfiguration.commission * 0.01) * askingPrice)), 1);

    const postItem = () =>
    {
        if(!item || (askingPrice < marketplaceConfiguration.minimumPrice)) return;

        showConfirm(LocalizeText('inventory.marketplace.confirm_offer.info', [ 'furniname', 'price' ], [ getFurniTitle, askingPrice.toString() ]), () =>
        {
            SendMessageComposer(new MakeOfferMessageComposer(askingPrice, item.isWallItem ? 2 : 1, item.id));
            setItem(null);
        },
        () =>
        {
            setItem(null)
        }, null, null, LocalizeText('inventory.marketplace.confirm_offer.title'));
    }

    return (
        <NitroCardView className="nitro-catalog-layout-marketplace-post-offer" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText('inventory.marketplace.make_offer.title') } onCloseClick={ event => setItem(null) } />
            <NitroCardContentView overflow="hidden">
                <div className="flex gap-3 h-full">
                    <div className="flex items-center justify-center w-1/3 shrink-0 bg-zinc-100 rounded-lg p-3">
                        <LayoutFurniImageView productType={ item.isWallItem ? ProductTypeEnum.WALL : ProductTypeEnum.FLOOR } productClassId={ item.type } extraData={ item.extra.toString() } />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex flex-col gap-1 flex-1">
                            <span className="text-sm font-semibold text-zinc-900">{ getFurniTitle }</span>
                            <span className="text-xs text-zinc-500 truncate">{ getFurniDescription }</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] text-zinc-400 italic">
                                { LocalizeText('inventory.marketplace.make_offer.expiration_info', [ 'time' ], [ marketplaceConfiguration.offerTime.toString() ]) }
                            </span>
                            <div className="flex flex-col gap-1">
                                <Input className="h-8 text-xs" type="number" min={ 0 } value={ tempAskingPrice } onChange={ event => updateAskingPrice(event.target.value) } placeholder={ LocalizeText('inventory.marketplace.make_offer.price_request') } />
                                { ((askingPrice < marketplaceConfiguration.minimumPrice) || isNaN(askingPrice)) &&
                                    <div className="text-[11px] text-red-500 mt-0.5">
                                        { LocalizeText('inventory.marketplace.make_offer.min_price', [ 'minprice' ], [ marketplaceConfiguration.minimumPrice.toString() ]) }
                                    </div> }
                                { ((askingPrice > marketplaceConfiguration.maximumPrice) && !isNaN(askingPrice)) &&
                                    <div className="text-[11px] text-red-500 mt-0.5">
                                        { LocalizeText('inventory.marketplace.make_offer.max_price', [ 'maxprice' ], [ marketplaceConfiguration.maximumPrice.toString() ]) }
                                    </div> }
                                { (!((askingPrice < marketplaceConfiguration.minimumPrice) || (askingPrice > marketplaceConfiguration.maximumPrice) || isNaN(askingPrice))) &&
                                    <div className="text-[11px] text-zinc-500 mt-0.5">
                                        { LocalizeText('inventory.marketplace.make_offer.final_price', [ 'commission', 'finalprice' ], [ getCommission().toString(), (askingPrice + getCommission()).toString() ]) }
                                    </div> }
                            </div>
                            <Button className="w-full h-8 text-xs" disabled={ ((askingPrice < marketplaceConfiguration.minimumPrice) || (askingPrice > marketplaceConfiguration.maximumPrice) || isNaN(askingPrice)) } onClick={ postItem }>
                                { LocalizeText('inventory.marketplace.make_offer.post') }
                            </Button>
                        </div>
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    )
}
