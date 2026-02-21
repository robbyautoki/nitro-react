import { FC, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Store, Search, Package, BarChart3, History, MessageCircle, ShoppingBag } from 'lucide-react';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { MarketplaceBrowseView } from './MarketplaceBrowseView';
import { MarketplaceOwnOffersView } from './MarketplaceOwnOffersView';
import { MarketplacePriceChartView } from './MarketplacePriceChartView';
import { CustomMarketplaceBrowseView } from './CustomMarketplaceBrowseView';
import { CustomMarketplaceSalesView } from './CustomMarketplaceSalesView';
import { CustomMarketplaceOffersView } from './CustomMarketplaceOffersView';
import { CustomMarketplaceSellView } from './CustomMarketplaceSellView';
import { CustomMarketplaceMyListingsView } from './CustomMarketplaceMyListingsView';

const TABS = [
    { id: 'custom-browse', label: 'Allgemein', icon: Store },
    { id: 'custom-my', label: 'Meine Angebote', icon: Package },
    { id: 'custom-sales', label: 'Meine Verkäufe', icon: History },
    { id: 'custom-offers', label: 'Anfragen', icon: MessageCircle },
    { id: 'custom-sell', label: 'Verkaufen', icon: ShoppingBag },
    { id: 'charts', label: 'Preisverlauf', icon: BarChart3 },
] as const;

export const MarketplaceView: FC<{}> = () =>
{
    const { isVisible, setIsVisible, currentTab, setCurrentTab } = useMarketplace();

    const onClose = useCallback(() => setIsVisible(false), [ setIsVisible ]);

    if(!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={ onClose } />

            {/* Outer ring */}
            <div className="relative w-[820px] max-h-[85vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                {/* Inner panel */}
                <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(85vh-4px)]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <Store className="size-4 text-white/70" />
                            <span className="text-sm font-semibold text-white/90 tracking-tight">Marktplatz</span>
                        </div>
                        <button
                            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                            onClick={ onClose }
                        >
                            <FaTimes className="size-3" />
                        </button>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex gap-1 px-4 pt-3 pb-2 shrink-0">
                        { TABS.map(tab =>
                        {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;

                            return (
                                <button
                                    key={ tab.id }
                                    className={ `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${ isActive
                                        ? 'bg-white/[0.12] text-white shadow-sm'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                                    }` }
                                    onClick={ () => setCurrentTab(tab.id) }
                                >
                                    <Icon className="size-3.5" />
                                    { tab.label }
                                </button>
                            );
                        }) }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 overflow-auto px-4 pb-4">
                        { currentTab === 'custom-browse' && <CustomMarketplaceBrowseView /> }
                        { currentTab === 'custom-my' && <CustomMarketplaceMyListingsView /> }
                        { currentTab === 'custom-sales' && <CustomMarketplaceSalesView /> }
                        { currentTab === 'custom-offers' && <CustomMarketplaceOffersView /> }
                        { currentTab === 'custom-sell' && <CustomMarketplaceSellView /> }
                        { currentTab === 'charts' && <MarketplacePriceChartView /> }
                    </div>
                </div>
            </div>
        </div>
    );
};
