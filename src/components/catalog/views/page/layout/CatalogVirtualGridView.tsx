import { FC, useEffect, useState } from 'react';
import { FaClock, FaFire } from 'react-icons/fa';
import { LocalizeText } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { loadTracked, TrackedPurchase } from '../../../CatalogView';

interface CatalogVirtualGridViewProps
{
    type: string;
}

export const CatalogVirtualGridView: FC<CatalogVirtualGridViewProps> = props =>
{
    const { type } = props;
    const { openPageByOfferId = null } = useCatalog();
    const storageKey = type === 'recent' ? 'catalog_recent_purchases' : 'catalog_most_purchased';
    const [ items, setItems ] = useState<TrackedPurchase[]>(() => loadTracked(storageKey));

    useEffect(() =>
    {
        const refresh = () => setItems(loadTracked(storageKey));

        window.addEventListener('catalog_purchase_tracked', refresh);
        return () => window.removeEventListener('catalog_purchase_tracked', refresh);
    }, [ storageKey ]);

    const Icon = type === 'recent' ? FaClock : FaFire;
    const title = type === 'recent'
        ? LocalizeText('catalog.nav.recent_purchases')
        : LocalizeText('catalog.nav.most_purchased');

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="shrink-0 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Icon className="text-paragraph-xs text-text-soft-400" />
                    <span className="text-subheading-2xs uppercase text-text-sub-600">{ title }</span>
                    <span className="text-paragraph-xs text-text-soft-400">({ items.length })</span>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2">
                { items.length === 0 && (
                    <div className="flex items-center justify-center h-full text-paragraph-xs text-text-soft-400">
                        { LocalizeText('catalog.frontpage.no_items') }
                    </div>
                ) }

                <div className="grid grid-cols-[repeat(auto-fill,82px)] gap-2">
                    { items.map((item, i) => (
                        <div
                            key={ i }
                            className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-10 bg-bg-white-0 shadow-regular-xs ring-1 ring-stroke-soft-200 transition-all duration-150 aspect-square group hover:bg-primary-alpha-10 hover:ring-primary-base hover:z-10"
                            style={ item.iconUrl ? { backgroundImage: `url(${ item.iconUrl })`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'contain' } : undefined }
                            onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                        >
                            {/* Name + Price overlay on hover */}
                            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center py-[2px] bg-bg-white-0/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <span className="text-paragraph-xs text-text-sub-600 truncate max-w-[68px] leading-tight">{ item.name }</span>
                                { item.priceCredits > 0 &&
                                    <span className="text-subheading-2xs text-warning-base">{ item.priceCredits }</span> }
                            </div>

                            {/* Count badge for frequent purchases */}
                            { item.count > 1 &&
                                <span className="absolute -top-0.5 -right-0.5 text-subheading-2xs bg-primary-alpha-10 text-primary-base rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none z-10">
                                    ×{ item.count }
                                </span> }
                        </div>
                    )) }
                </div>
            </div>
        </div>
    );
}
