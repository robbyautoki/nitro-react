import { FC, useCallback, useEffect, useState } from 'react';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { ItemInfoModal } from './ItemInfoModal';
import { CustomListing } from './CustomMarketplaceTypes';
import { Package, ShoppingBag } from 'lucide-react';

export const CustomMarketplaceMyListingsView: FC<{}> = () =>
{
    const [ listings, setListings ] = useState<CustomListing[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ infoTarget, setInfoTarget ] = useState<CustomListing | null>(null);

    const loadListings = useCallback(() =>
    {
        setLoading(true);
        CustomMarketplaceApi.myListings()
            .then(data => setListings(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadListings(); }, [ loadListings ]);

    const handleCancel = async (listing: CustomListing) =>
    {
        const res = await CustomMarketplaceApi.cancelListing(listing.id);
        if(res.ok) setListings(prev => prev.filter(l => l.id !== listing.id));
    };

    if(loading) return <div className="text-center py-8 text-white/30 text-xs">Laden...</div>;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <ShoppingBag className="size-3.5 text-white/40" />
                <span className="text-[11px] font-medium text-white/50">
                    { listings.length > 0
                        ? `${ listings.length } aktive${ listings.length === 1 ? 's Angebot' : ' Angebote' }`
                        : 'Keine aktiven Angebote'
                    }
                </span>
            </div>

            { listings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <Package className="size-10 mb-2" />
                    <span className="text-xs">Du hast keine aktiven Angebote</span>
                </div>
            ) }

            <div className="flex flex-col gap-1.5">
                { listings.map(listing => (
                    <CustomListingCard
                        key={ listing.id }
                        listing={ listing }
                        mode="own"
                        onCancel={ () => handleCancel(listing) }
                        onInfo={ () => setInfoTarget(listing) }
                    />
                )) }
            </div>

            { infoTarget && <ItemInfoModal listing={ infoTarget } onClose={ () => setInfoTarget(null) } /> }
        </div>
    );
};
