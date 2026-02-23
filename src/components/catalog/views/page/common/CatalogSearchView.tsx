import { IFurnitureData } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { CatalogPage, CatalogType, FilterCatalogNode, FurnitureOffer, GetOfferNodes, GetSessionDataManager, ICatalogNode, ICatalogPage, IPurchasableOffer, LocalizeText, PageLocalization, SearchResult } from '../../../../../api';
import { useCatalog } from '../../../../../hooks';
import { Input } from '../../../../ui/input';

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
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] pointer-events-none" />
            <Input
                type="text"
                className="h-9 text-xs pl-8 pr-8 rounded-xl border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-all duration-200"
                placeholder={ LocalizeText('generic.search') }
                value={ searchValue }
                onChange={ event => setSearchValue(event.target.value) }
            />
            { searchValue && !!searchValue.length &&
                <button
                    className="appearance-none border-0 bg-transparent absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                    onClick={ () => setSearchValue('') }
                >
                    <FaTimes className="text-[9px]" />
                </button> }
        </div>
    );
}
