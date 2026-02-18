import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, MarketplaceOfferData, MarketplaceSearchType, IMarketplaceSearchOptions } from '../../api';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { MarketplaceItemCard } from './MarketplaceItemCard';
import { Search } from 'lucide-react';

const SORT_TYPES_VALUE = [ 1, 2 ];
const SORT_TYPES_ACTIVITY = [ 3, 4, 5, 6 ];
const SORT_TYPES_ADVANCED = [ 1, 2, 3, 4, 5, 6 ];

export const MarketplaceBrowseView: FC<{}> = () =>
{
    const { offers, totalItemsFound, searchType, setSearchType, requestOffers, purchaseOffer } = useMarketplace();
    const [ sortType, setSortType ] = useState(3);
    const [ searchQuery, setSearchQuery ] = useState('');
    const [ minPrice, setMinPrice ] = useState('');
    const [ maxPrice, setMaxPrice ] = useState('');

    const sortTypes = useMemo(() =>
    {
        switch(searchType)
        {
            case MarketplaceSearchType.BY_ACTIVITY: return SORT_TYPES_ACTIVITY;
            case MarketplaceSearchType.BY_VALUE: return SORT_TYPES_VALUE;
            case MarketplaceSearchType.ADVANCED: return SORT_TYPES_ADVANCED;
        }
        return [];
    }, [ searchType ]);

    const doSearch = useCallback((overrideSortType?: number) =>
    {
        const type = overrideSortType ?? sortType;
        const min = parseInt(minPrice) || -1;
        const max = parseInt(maxPrice) || -1;
        requestOffers({ minPrice: min, maxPrice: max, query: searchQuery, type });
    }, [ sortType, minPrice, maxPrice, searchQuery, requestOffers ]);

    const onSortTypeChange = useCallback((newSort: number) =>
    {
        setSortType(newSort);
        if(searchType !== MarketplaceSearchType.ADVANCED) doSearch(newSort);
    }, [ searchType, doSearch ]);

    const onSearchTypeChange = useCallback((type: number) =>
    {
        setSearchType(type);
        setSearchQuery('');
        setMinPrice('');
        setMaxPrice('');
    }, [ setSearchType ]);

    // Auto-search on mount
    useEffect(() =>
    {
        if(searchType !== MarketplaceSearchType.ADVANCED) doSearch();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col gap-3">
            {/* Search Type Tabs */}
            <div className="flex gap-1">
                { [ MarketplaceSearchType.BY_ACTIVITY, MarketplaceSearchType.BY_VALUE, MarketplaceSearchType.ADVANCED ].map(type => (
                    <button
                        key={ type }
                        className={ `px-3 py-1.5 text-[11px] rounded-lg font-medium transition-all ${ searchType === type
                            ? 'bg-white/[0.12] text-white'
                            : 'text-white/40 hover:text-white/60 hover:bg-white/[0.05]'
                        }` }
                        onClick={ () => onSearchTypeChange(type) }
                    >
                        { type === MarketplaceSearchType.BY_ACTIVITY && 'Activity' }
                        { type === MarketplaceSearchType.BY_VALUE && 'Value' }
                        { type === MarketplaceSearchType.ADVANCED && 'Search' }
                    </button>
                )) }
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/40 shrink-0">Sort:</span>
                <select
                    className="flex-1 h-7 px-2 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 outline-none"
                    value={ sortType }
                    onChange={ e => onSortTypeChange(parseInt(e.target.value)) }
                >
                    { sortTypes.map(type => (
                        <option key={ type } value={ type } className="bg-zinc-900">
                            { LocalizeText(`catalog.marketplace.sort.${ type }`) }
                        </option>
                    )) }
                </select>
            </div>

            {/* Advanced Search Fields */}
            { searchType === MarketplaceSearchType.ADVANCED && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            className="flex-1 h-7 px-2.5 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                            type="text"
                            placeholder="Item name..."
                            value={ searchQuery }
                            onChange={ e => setSearchQuery(e.target.value) }
                            onKeyDown={ e => e.key === 'Enter' && doSearch() }
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            className="flex-1 h-7 px-2.5 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                            type="number"
                            min={ 0 }
                            placeholder="Min price"
                            value={ minPrice }
                            onChange={ e => setMinPrice(e.target.value) }
                        />
                        <span className="text-white/30 text-[11px]">-</span>
                        <input
                            className="flex-1 h-7 px-2.5 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                            type="number"
                            min={ 0 }
                            placeholder="Max price"
                            value={ maxPrice }
                            onChange={ e => setMaxPrice(e.target.value) }
                        />
                        <button
                            className="h-7 px-3 rounded-lg bg-white/[0.1] text-white/80 text-[11px] font-medium hover:bg-white/[0.15] transition-all flex items-center gap-1"
                            onClick={ () => doSearch() }
                        >
                            <Search className="size-3" />
                            Search
                        </button>
                    </div>
                </div>
            ) }

            {/* Results */}
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/40">
                    { offers.size > 0
                        ? `${ offers.size } items found`
                        : 'No items found'
                    }
                </span>
            </div>

            <div className="flex flex-col gap-1.5">
                { Array.from(offers.values()).map(offer => (
                    <MarketplaceItemCard
                        key={ offer.offerId }
                        offerData={ offer }
                        type="public"
                        onAction={ purchaseOffer }
                    />
                )) }
            </div>
        </div>
    );
};
