import { FC, useCallback, useEffect, useState } from 'react';
import { IMarketplaceSearchOptions, LocalizeText, MarketplaceSearchType } from '../../../../../../api';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as Input from '@/align-ui/components/ui/input';
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
                <span className="w-[100px] text-[10px] uppercase font-bold text-text-soft-400 tracking-[0.1em] shrink-0">{ LocalizeText('catalog.marketplace.sort_order') }</span>
                <div className="flex-1 overflow-hidden">
                    <CatalogNativeSelect value={ sortType } onChange={ event => onSortTypeChange(parseInt(event.target.value)) } className="h-7 text-xs">
                        { sortTypes.map(type => <option key={ type } value={ type }>{ LocalizeText(`catalog.marketplace.sort.${ type }`) }</option>) }
                    </CatalogNativeSelect>
                </div>
            </div>
            { searchType === MarketplaceSearchType.ADVANCED &&
                <>
                    <div className="flex items-center gap-2">
                        <span className="w-[100px] text-[10px] uppercase font-bold text-text-soft-400 tracking-[0.1em] shrink-0">{ LocalizeText('catalog.marketplace.search_name') }</span>
                        <Input.Root size="xsmall">
                            <Input.Wrapper className="h-7">
                                <Input.Input className="h-7 text-xs" type="text" value={ searchQuery } onChange={ event => setSearchQuery(event.target.value) } placeholder="FURNI NAME..." />
                            </Input.Wrapper>
                        </Input.Root>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-[100px] text-[10px] uppercase font-bold text-text-soft-400 tracking-[0.1em] shrink-0">{ LocalizeText('catalog.marketplace.search_price') }</span>
                        <div className="flex flex-1 gap-2">
                            <Input.Root size="xsmall">
                                <Input.Wrapper className="h-7">
                                    <Input.Input className="h-7 text-xs font-mono text-warning-base" type="number" min={ 0 } value={ min } onChange={ event => setMin(event.target.valueAsNumber) } placeholder="MIN" />
                                </Input.Wrapper>
                            </Input.Root>
                            <Input.Root size="xsmall">
                                <Input.Wrapper className="h-7">
                                    <Input.Input className="h-7 text-xs font-mono text-warning-base" type="number" min={ 0 } value={ max } onChange={ event => setMax(event.target.valueAsNumber) } placeholder="MAX" />
                                </Input.Wrapper>
                            </Input.Root>
                        </div>
                    </div>
                    <AlignButton.Root
                        variant="primary"
                        mode="lighter"
                        size="xsmall"
                        className="mt-2 w-full h-8 text-[11px] font-bold uppercase tracking-widest"
                        onClick={ onClickSearch }
                    >
                        { LocalizeText('generic.search') }
                    </AlignButton.Root>
                </> }
        </div>
    );
}
