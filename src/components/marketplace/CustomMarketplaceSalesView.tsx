import { FC, useEffect, useState } from 'react';
import { Package, Loader2, AlertTriangle } from 'lucide-react';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CustomListing } from './CustomMarketplaceTypes';

export const CustomMarketplaceSalesView: FC<{}> = () =>
{
    const [ sales, setSales ] = useState<CustomListing[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState('');

    useEffect(() =>
    {
        CustomMarketplaceApi.mySales()
            .then(data => setSales(Array.isArray(data) ? data : []))
            .catch(() => setError('Verkäufe konnten nicht geladen werden'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col h-full">
            { /* Error Banner */ }
            { error && (
                <div className="flex items-center gap-2 border-b border-error-base/20 bg-error-lighter px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-error-base shrink-0" />
                    <span className="text-paragraph-xs text-error-base">{ error }</span>
                </div>
            ) }
            <div className="min-h-0 flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                { loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-text-sub-600">
                        <Loader2 className="w-6 h-6 animate-spin opacity-30 mb-2" />
                        <p className="text-paragraph-xs">Laden...</p>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-text-sub-600">
                        <Package className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-paragraph-xs">Du hast noch nichts verkauft</p>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        { sales.map(sale => (
                            <CustomListingCard key={ sale.id } listing={ sale } mode="sold" />
                        )) }
                    </div>
                ) }
            </div>
        </div>
    );
};
