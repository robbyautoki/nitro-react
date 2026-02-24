import { FurnitureListComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CustomListing } from './CustomMarketplaceTypes';
import { Package, ShoppingBag } from 'lucide-react';

export const CustomMarketplaceMyListingsView: FC<{}> = () =>
{
    const [ listings, setListings ] = useState<CustomListing[]>([]);
    const [ loading, setLoading ] = useState(true);

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
        if(res.ok)
        {
            setListings(prev => prev.filter(l => l.id !== listing.id));
            // Refresh inventory so returned items appear again
            SendMessageComposer(new FurnitureListComposer());
        }
    };

    return (
        <div className="flex flex-col h-full gap-3 bg-[#0a0a0a] rounded-xl p-3 border border-white/[0.04]">
            
            <div className="flex flex-col flex-1 min-h-0 mt-2">
                <div className="flex items-center justify-between shrink-0 px-2 border-b border-white/[0.08] pb-2">
                    <span className="text-[10px] font-bold font-mono text-white/30 uppercase tracking-[0.1em]">
                        { listings.length } ACTIVE LISTINGS
                    </span>
                    <div className="flex items-center text-[10px] font-bold font-mono text-white/30 uppercase tracking-[0.1em] gap-8 pr-12">
                        <span className="w-24 text-right">PRICE</span>
                        <span className="w-24 text-right">ACTIONS</span>
                    </div>
                </div>
                
                <div className="flex flex-col overflow-auto h-full rounded border border-white/[0.04] bg-[#050505]">
                    { loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-emerald-500/50 text-xs gap-2 py-8">
                            <span className="text-xs font-mono uppercase tracking-[0.2em]">FETCHING DATA...</span>
                        </div>
                    ) : listings.length > 0 ? (
                        listings.map(listing => (
                            <CustomListingCard
                                key={ listing.id }
                                listing={ listing }
                                mode="own"
                                onCancel={ () => handleCancel(listing) }
                            />
                        ))
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-xs gap-2 py-8">
                            <span className="text-3xl font-mono opacity-50">¯\_(ツ)_/¯</span>
                            <span className="font-mono uppercase tracking-[0.1em]">No active listings</span>
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
};
