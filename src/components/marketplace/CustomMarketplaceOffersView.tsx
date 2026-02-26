import { FC, useEffect, useState, useCallback } from 'react';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomOffer } from './CustomMarketplaceTypes';
import { OfferRow } from './CustomListingCard';
import { fmtC } from './marketplace-utils';
import { CurrencyIcon } from './marketplace-components';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MessageCircle, Package, Loader2, AlertTriangle } from 'lucide-react';

export const CustomMarketplaceOffersView: FC<{}> = () =>
{
    const [ offers, setOffers ] = useState<CustomOffer[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState('');
    const [ processing, setProcessing ] = useState<number | null>(null);

    const [ acceptTarget, setAcceptTarget ] = useState<CustomOffer | null>(null);
    const [ rejectTarget, setRejectTarget ] = useState<CustomOffer | null>(null);

    const loadOffers = useCallback(() =>
    {
        setLoading(true);
        setError('');
        CustomMarketplaceApi.myOffersReceived()
            .then(data => setOffers(Array.isArray(data) ? data : []))
            .catch(() => setError('Anfragen konnten nicht geladen werden'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadOffers(); }, [ loadOffers ]);

    const handleAccept = async (offer: CustomOffer) =>
    {
        setProcessing(offer.offer_id);
        setError('');
        try
        {
            const res = await CustomMarketplaceApi.acceptOffer(offer.offer_id);
            if(res.ok)
            {
                setOffers(prev => prev.filter(o => o.offer_id !== offer.offer_id));
            }
            else
            {
                setError(res.error || 'Angebot konnte nicht angenommen werden');
            }
        }
        catch
        {
            setError('Netzwerkfehler — bitte erneut versuchen');
        }
        finally
        {
            setProcessing(null);
            setAcceptTarget(null);
        }
    };

    const handleReject = async (offer: CustomOffer) =>
    {
        setProcessing(offer.offer_id);
        setError('');
        try
        {
            const res = await CustomMarketplaceApi.rejectOffer(offer.offer_id);
            if(res.ok)
            {
                setOffers(prev => prev.filter(o => o.offer_id !== offer.offer_id));
            }
            else
            {
                setError(res.error || 'Angebot konnte nicht abgelehnt werden');
            }
        }
        catch
        {
            setError('Netzwerkfehler — bitte erneut versuchen');
        }
        finally
        {
            setProcessing(null);
            setRejectTarget(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Error Banner */}
            { error && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-destructive/20 bg-destructive/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <span className="text-[11px] text-destructive">{ error }</span>
                </div>
            ) }

            <ScrollArea className="flex-1 min-h-0">
                { loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin opacity-30 mb-2" />
                        <p className="text-xs">Laden...</p>
                    </div>
                ) : offers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <MessageCircle className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-xs">Keine offenen Anfragen</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        { offers.map(offer => (
                            <OfferRow
                                key={ offer.offer_id }
                                offer={ offer }
                                onAccept={ () => setAcceptTarget(offer) }
                                onReject={ () => setRejectTarget(offer) }
                                isProcessing={ processing === offer.offer_id }
                            />
                        )) }
                    </div>
                ) }
            </ScrollArea>

            {/* Accept Offer Dialog */}
            <AlertDialog open={ !!acceptTarget } onOpenChange={ o => !o && !processing && setAcceptTarget(null) }>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Angebot annehmen</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-semibold text-foreground">{ acceptTarget?.buyer?.username }</span> bietet <span className="font-bold text-amber-500">{ acceptTarget ? fmtC(acceptTarget.offer_price) : 0 } Credits</span> für dein(e) <span className="font-semibold text-foreground">{ acceptTarget?.items[0]?.public_name }</span>. Annehmen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={ !!processing }>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700" disabled={ !!processing } onClick={ () => acceptTarget && handleAccept(acceptTarget) }>
                            { processing ? 'Wird angenommen...' : 'Annehmen' }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reject Offer Dialog */}
            <AlertDialog open={ !!rejectTarget } onOpenChange={ o => !o && !processing && setRejectTarget(null) }>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Angebot ablehnen</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du das Angebot von <span className="font-semibold text-foreground">{ rejectTarget?.buyer?.username }</span> über <span className="font-bold text-amber-500">{ rejectTarget ? fmtC(rejectTarget.offer_price) : 0 } Credits</span> ablehnen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={ !!processing }>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={ !!processing } onClick={ () => rejectTarget && handleReject(rejectTarget) }>
                            { processing ? 'Wird abgelehnt...' : 'Ablehnen' }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
