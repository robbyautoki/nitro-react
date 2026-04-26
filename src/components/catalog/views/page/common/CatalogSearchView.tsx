import { IFurnitureData } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { CatalogPage, CatalogType, FilterCatalogNode, FurnitureOffer, GetOfferNodes, GetSessionDataManager, ICatalogNode, ICatalogPage, IPurchasableOffer, LocalizeText, PageLocalization, SearchResult } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import * as Input from '@/align-ui/components/ui/input';

export const CatalogSearchView: FC<{}> = props =>
{
    const [ searchValue, setSearchValue ] = useState('');
    const { currentType = null, rootNode = null, offersToNodes = null, searchResult = null, setSearchResult = null, setCurrentPage = null } = useCatalog();

    useEffect(() =>
    {
        const trimmed = searchValue?.trim().toLowerCase();

        if(!trimmed || !trimmed.length)
        {
            setSearchResult(null);

            return;
        }

        const timeout = setTimeout(() =>
        {
            const searchWords = trimmed.split(/\s+/).filter(w => w.length > 0);
            const searchCombined = searchWords.join('');

            const matches = (haystack: string): boolean =>
            {
                const haystackCombined = haystack.replace(/ /gi, '').toLowerCase();

                if(haystackCombined.indexOf(searchCombined) >= 0) return true;

                const haystackLower = haystack.toLowerCase();

                return searchWords.every(word => haystackLower.indexOf(word) >= 0);
            };

            const furnitureDatas = GetSessionDataManager().getAllFurnitureData({
                loadFurnitureData: null
            });

            if(!furnitureDatas || !furnitureDatas.length) return;

            const foundFurniture: IFurnitureData[] = [];
            const foundFurniLines: string[] = [];

            for(const furniture of furnitureDatas)
            {
                if((currentType === CatalogType.BUILDER) && !furniture.availableForBuildersClub) continue;

                if((currentType === CatalogType.NORMAL) && furniture.excludeDynamic) continue;

                const haystack = [ furniture.className, furniture.name, furniture.description ].join(' ');

                if((currentType === CatalogType.BUILDER) && (furniture.purchaseOfferId === -1) && (furniture.rentOfferId === -1))
                {
                    if((furniture.furniLine !== '') && (foundFurniLines.indexOf(furniture.furniLine) < 0))
                    {
                        if(matches(haystack)) foundFurniLines.push(furniture.furniLine);
                    }
                }
                else
                {
                    const foundNodes = [
                        ...GetOfferNodes(offersToNodes, furniture.purchaseOfferId),
                        ...GetOfferNodes(offersToNodes, furniture.rentOfferId)
                    ];

                    if(foundNodes.length)
                    {
                        if(matches(haystack)) foundFurniture.push(furniture);

                        if(foundFurniture.length === 500) break;
                    }
                }
            }

            const offers: IPurchasableOffer[] = [];

            for(const furniture of foundFurniture) offers.push(new FurnitureOffer(furniture));

            let nodes: ICatalogNode[] = [];

            FilterCatalogNode(searchCombined, foundFurniLines, rootNode, nodes);

            setSearchResult(new SearchResult(searchCombined, offers, nodes.filter(node => (node.isVisible))));
            setCurrentPage((new CatalogPage(-1, 'default_3x3', new PageLocalization([], []), offers, false, 1) as ICatalogPage));
        }, 300);

        return () => clearTimeout(timeout);
    }, [ offersToNodes, currentType, rootNode, searchValue, setCurrentPage, setSearchResult ]);

    return (
        <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paragraph-xs text-text-soft-400" />
            <Input.Root size="small">
                <Input.Wrapper className="h-9 pl-8 pr-8">
                    <Input.Input
                        type="text"
                        className="text-paragraph-sm"
                        placeholder={ LocalizeText('generic.search') }
                        value={ searchValue }
                        onChange={ event => setSearchValue(event.target.value) }
                    />
                </Input.Wrapper>
            </Input.Root>
            { searchValue && !!searchValue.length &&
                <button
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 appearance-none rounded border-0 bg-transparent p-0.5 text-text-soft-400 transition-colors hover:text-text-strong-950"
                    onClick={ () => setSearchValue('') }
                >
                    <FaTimes className="text-subheading-2xs" />
                </button> }
        </div>
    );
}
