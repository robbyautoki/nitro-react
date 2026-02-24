import { FC, useCallback, useEffect, useState } from 'react';
import { IMarketplaceSearchOptions, LocalizeText, MarketplaceSearchType } from '../../../../../../api';
import { Button } from '../../../../../ui/button';
import { Input } from '../../../../../ui/input';
import { CatalogNativeSelect } from '../../../CatalogNativeSelect';

export interface SearchFormViewProps
{
    searchType: number;
    sortTypes: number[];
    onSearch(options: IMarketplaceSearchOptions): void;
}

export const SearchFormView: FC<SearchFormViewProps> = props =>
{
    const { searchType = null, sortTypes = null, onSearch = null } = props;
    const [ sortType, setSortType ] = useState(sortTypes ? sortTypes[0] : 3); // first item of SORT_TYPES_ACTIVITY
    const [ searchQuery, setSearchQuery ] = useState('');
    const [ min, setMin ] = useState(0);
    const [ max, setMax ] = useState(0);

    const onSortTypeChange = useCallback((sortType: number) =>
    {
        setSortType(sortType);

        if((searchType === MarketplaceSearchType.BY_ACTIVITY) || (searchType === MarketplaceSearchType.BY_VALUE)) onSearch({ minPrice: -1, maxPrice: -1, query: '', type: sortType });
    }, [ onSearch, searchType ]);

    const onClickSearch = useCallback(() =>
    {
        const minPrice = ((min > 0) ? min : -1);
        const maxPrice = ((max > 0) ? max : -1);

        onSearch({ minPrice: minPrice, maxPrice: maxPrice, type: sortType, query: searchQuery })
    }, [ max, min, onSearch, searchQuery, sortType ]);

    useEffect( () =>
    {
        if(!sortTypes || !sortTypes.length) return;

        const sortType = sortTypes[0];

        setSortType(sortType);

        if(searchType === MarketplaceSearchType.BY_ACTIVITY || MarketplaceSearchType.BY_VALUE === searchType) onSearch({ minPrice: -1, maxPrice: -1, query: '', type: sortType });
    }, [ onSearch, searchType, sortTypes ]);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className="w-[100px] text-[10px] uppercase font-bold text-white/40 tracking-[0.1em] shrink-0">{ LocalizeText('catalog.marketplace.sort_order') }</span>
                <div className="flex-1 bg-black/40 border border-white/10 rounded overflow-hidden">
                    <CatalogNativeSelect value={ sortType } onChange={ event => onSortTypeChange(parseInt(event.target.value)) } className="text-xs h-7 bg-transparent border-0 text-white/80 focus:ring-0">
                        { sortTypes.map(type => <option key={ type } value={ type } className="bg-black text-white">{ LocalizeText(`catalog.marketplace.sort.${ type }`) }</option>) }
                    </CatalogNativeSelect>
                </div>
            </div>
            { searchType === MarketplaceSearchType.ADVANCED &&
                <>
                    <div className="flex items-center gap-2">
                        <span className="w-[100px] text-[10px] uppercase font-bold text-white/40 tracking-[0.1em] shrink-0">{ LocalizeText('catalog.marketplace.search_name') }</span>
                        <Input className="h-7 text-xs bg-black/40 border-white/10 text-white/90 rounded focus-visible:ring-1 focus-visible:ring-emerald-500/50" type="text" value={ searchQuery } onChange={ event => setSearchQuery(event.target.value) } placeholder="FURNI NAME..." />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-[100px] text-[10px] uppercase font-bold text-white/40 tracking-[0.1em] shrink-0">{ LocalizeText('catalog.marketplace.search_price') }</span>
                        <div className="flex flex-1 gap-2">
                            <Input className="h-7 text-xs font-mono bg-black/40 border-white/10 text-amber-400 rounded focus-visible:ring-1 focus-visible:ring-emerald-500/50" type="number" min={ 0 } value={ min } onChange={ event => setMin(event.target.valueAsNumber) } placeholder="MIN" />
                            <Input className="h-7 text-xs font-mono bg-black/40 border-white/10 text-amber-400 rounded focus-visible:ring-1 focus-visible:ring-emerald-500/50" type="number" min={ 0 } value={ max } onChange={ event => setMax(event.target.valueAsNumber) } placeholder="MAX" />
                        </div>
                    </div>
                    <button 
                        className="mt-2 w-full h-8 flex items-center justify-center bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-widest rounded transition-colors" 
                        onClick={ onClickSearch }
                    >
                        { LocalizeText('generic.search') }
                    </button>
                </> }
        </div>
    );
}
