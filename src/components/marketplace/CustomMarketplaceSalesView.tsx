import { FC, useEffect, useState } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CustomListing } from './CustomMarketplaceTypes';
import { ScrollArea } from '@/components/ui/scroll-area';

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

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 min-h-0">
                { loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin opacity-30 mb-2" />
                        <p className="text-xs">Laden...</p>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Package className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-xs">Du hast noch nichts verkauft</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        { sales.map(sale => (
                            <CustomListingCard key={ sale.id } listing={ sale } mode="sold" />
                        )) }
                    </div>
                ) }
            </ScrollArea>
        </div>
    );
};
