import { FC, useEffect, useState } from 'react';
import { History, Package } from 'lucide-react';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CustomListing } from './CustomMarketplaceTypes';

export const CustomMarketplaceSalesView: FC<{}> = () =>
{
    const [ sales, setSales ] = useState<CustomListing[]>([]);
    const [ loading, setLoading ] = useState(true);

    useEffect(() =>
    {
        CustomMarketplaceApi.mySales()
            .then(data => setSales(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, []);

    if(loading) return <div className="text-center py-8 text-white/30 text-xs">Laden...</div>;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <History className="size-3.5 text-white/40" />
                <span className="text-[11px] font-medium text-white/50">
                    { sales.length > 0
                        ? `${ sales.length } verkaufte${ sales.length === 1 ? 's Angebot' : ' Angebote' }`
                        : 'Noch keine Verkäufe'
                    }
                </span>
            </div>

            { sales.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                    <Package className="size-10 mb-2" />
                    <span className="text-xs">Du hast noch nichts verkauft</span>
                </div>
            ) }

            <div className="flex flex-col gap-1.5">
                { sales.map(sale => (
                    <CustomListingCard key={ sale.id } listing={ sale } mode="sold" />
                )) }
            </div>
        </div>
    );
};
