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
        let search = searchValue?.toLocaleLowerCase().replace(' ', '');

        if(!search || !search.length)
        {
            setSearchResult(null);

            return;
        }

        const timeout = setTimeout(() =>
        {
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

                const searchValues = [ furniture.className, furniture.name, furniture.description ].join(' ').replace(/ /gi, '').toLowerCase();

                if((currentType === CatalogType.BUILDER) && (furniture.purchaseOfferId === -1) && (furniture.rentOfferId === -1))
                {
                    if((furniture.furniLine !== '') && (foundFurniLines.indexOf(furniture.furniLine) < 0))
                    {
                        if(searchValues.indexOf(search) >= 0) foundFurniLines.push(furniture.furniLine);
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
                        if(searchValues.indexOf(search) >= 0) foundFurniture.push(furniture);

                        if(foundFurniture.length === 250) break;
                    }
                }
            }

            const offers: IPurchasableOffer[] = [];

            for(const furniture of foundFurniture) offers.push(new FurnitureOffer(furniture));

            let nodes: ICatalogNode[] = [];

            FilterCatalogNode(search, foundFurniLines, rootNode, nodes);

            setSearchResult(new SearchResult(search, offers, nodes.filter(node => (node.isVisible))));
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
