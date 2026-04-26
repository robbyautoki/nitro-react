import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { LocalizeText, MarketplaceSearchType } from '../../api';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { MarketplaceItemCard } from './MarketplaceItemCard';
import { Search } from 'lucide-react';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignSelect from '@/align-ui/components/ui/select';

const SORT_TYPES_VALUE = [ 1, 2 ];
const SORT_TYPES_ACTIVITY = [ 3, 4, 5, 6 ];
const SORT_TYPES_ADVANCED = [ 1, 2, 3, 4, 5, 6 ];

export const MarketplaceBrowseView: FC<{}> = () =>
{
    const { offers, searchType, setSearchType, requestOffers, purchaseOffer } = useMarketplace();
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
        <div className="flex flex-col gap-3 bg-bg-white-0 text-text-strong-950">
            { /* Search Type Tabs */ }
            <div className="flex gap-1">
                { [ MarketplaceSearchType.BY_ACTIVITY, MarketplaceSearchType.BY_VALUE, MarketplaceSearchType.ADVANCED ].map(type => (
                    <AlignButton.Root
                        key={ type }
                        variant="neutral"
                        mode={ searchType === type ? 'lighter' : 'ghost' }
                        size="xxsmall"
                        className="text-label-xs"
                        onClick={ () => onSearchTypeChange(type) }
                    >
                        { type === MarketplaceSearchType.BY_ACTIVITY && 'Activity' }
                        { type === MarketplaceSearchType.BY_VALUE && 'Value' }
                        { type === MarketplaceSearchType.ADVANCED && 'Search' }
                    </AlignButton.Root>
                )) }
            </div>
            { /* Sort */ }
            <div className="flex items-center gap-2">
                <span className="shrink-0 text-paragraph-xs text-text-sub-600">Sort:</span>
                <AlignSelect.Root value={ String(sortType) } onValueChange={ value => onSortTypeChange(parseInt(value)) } size="xsmall">
                    <AlignSelect.Trigger className="flex-1">
                        <AlignSelect.Value />
                    </AlignSelect.Trigger>
                    <AlignSelect.Content>
                        { sortTypes.map(type => (
                            <AlignSelect.Item key={ type } value={ String(type) }>
                                { LocalizeText(`catalog.marketplace.sort.${ type }`) }
                            </AlignSelect.Item>
                        )) }
                    </AlignSelect.Content>
                </AlignSelect.Root>
            </div>
            { /* Advanced Search Fields */ }
            { searchType === MarketplaceSearchType.ADVANCED && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <AlignInput.Root size="xsmall" className="flex-1">
                            <AlignInput.Wrapper className="h-8">
                                <AlignInput.Input
                                    className="h-8 text-paragraph-xs"
                                    type="text"
                                    placeholder="Item name..."
                                    value={ searchQuery }
                                    onChange={ e => setSearchQuery(e.target.value) }
                                    onKeyDown={ e => e.key === 'Enter' && doSearch() }
                                />
                            </AlignInput.Wrapper>
                        </AlignInput.Root>
                    </div>
                    <div className="flex items-center gap-2">
                        <AlignInput.Root size="xsmall" className="flex-1">
                            <AlignInput.Wrapper className="h-8">
                                <AlignInput.Input
                                    className="h-8 text-paragraph-xs"
                                    type="number"
                                    min={ 0 }
                                    placeholder="Min price"
                                    value={ minPrice }
                                    onChange={ e => setMinPrice(e.target.value) }
                                />
                            </AlignInput.Wrapper>
                        </AlignInput.Root>
                        <span className="text-paragraph-xs text-text-soft-400">-</span>
                        <AlignInput.Root size="xsmall" className="flex-1">
                            <AlignInput.Wrapper className="h-8">
                                <AlignInput.Input
                                    className="h-8 text-paragraph-xs"
                                    type="number"
                                    min={ 0 }
                                    placeholder="Max price"
                                    value={ maxPrice }
                                    onChange={ e => setMaxPrice(e.target.value) }
                                />
                            </AlignInput.Wrapper>
                        </AlignInput.Root>
                        <AlignButton.Root
                            variant="primary"
                            mode="lighter"
                            size="xxsmall"
                            onClick={ () => doSearch() }
                        >
                            <Search className="size-3" />
                            Search
                        </AlignButton.Root>
                    </div>
                </div>
            ) }
            { /* Results */ }
            <div className="flex items-center justify-between">
                <span className="text-paragraph-xs text-text-sub-600">
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
