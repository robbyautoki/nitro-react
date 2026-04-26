import { FC, useEffect, useState, useCallback } from 'react';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomOffer } from './CustomMarketplaceTypes';
import { OfferRow } from './CustomListingCard';
import { fmtC } from './marketplace-utils';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignModal from '@/align-ui/components/ui/modal';
import { MessageCircle, Loader2, AlertTriangle } from 'lucide-react';

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

    useEffect(() =>
    {
        loadOffers();
    }, [ loadOffers ]);

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
                ) : offers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-text-sub-600">
                        <MessageCircle className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-paragraph-xs">Keine offenen Anfragen</p>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
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
            </div>
            { /* Accept Offer Dialog */ }
            <AlignModal.Root open={ !!acceptTarget } onOpenChange={ o => !o && !processing && setAcceptTarget(null) }>
                <AlignModal.Content className="max-w-[380px]" overlayClassName="z-[1000]" showClose={ false }>
                    <AlignModal.Header
                        title="Angebot annehmen"
                        description="Beim Annehmen wird das Angebot abgeschlossen."
                    />
                    <AlignModal.Body>
                        <p className="text-paragraph-sm text-text-sub-600">
                            <span className="font-semibold text-text-strong-950">{ acceptTarget?.buyer?.username }</span> bietet <span className="font-bold text-warning-base">{ acceptTarget ? fmtC(acceptTarget.offer_price) : 0 } Credits</span> für dein(e) <span className="font-semibold text-text-strong-950">{ acceptTarget?.items[0]?.public_name }</span>. Annehmen?
                        </p>
                    </AlignModal.Body>
                    <AlignModal.Footer className="justify-end">
                        <AlignButton.Root variant="neutral" mode="stroke" size="small" disabled={ !!processing } onClick={ () => setAcceptTarget(null) }>Abbrechen</AlignButton.Root>
                        <AlignButton.Root variant="primary" mode="filled" size="small" disabled={ !!processing } onClick={ () => acceptTarget && handleAccept(acceptTarget) }>
                            { processing ? 'Wird angenommen...' : 'Annehmen' }
                        </AlignButton.Root>
                    </AlignModal.Footer>
                </AlignModal.Content>
            </AlignModal.Root>
            { /* Reject Offer Dialog */ }
            <AlignModal.Root open={ !!rejectTarget } onOpenChange={ o => !o && !processing && setRejectTarget(null) }>
                <AlignModal.Content className="max-w-[380px]" overlayClassName="z-[1000]" showClose={ false }>
                    <AlignModal.Header
                        title="Angebot ablehnen"
                        description="Diese Anfrage wird aus deiner Liste entfernt."
                    />
                    <AlignModal.Body>
                        <p className="text-paragraph-sm text-text-sub-600">
                            Möchtest du das Angebot von <span className="font-semibold text-text-strong-950">{ rejectTarget?.buyer?.username }</span> über <span className="font-bold text-warning-base">{ rejectTarget ? fmtC(rejectTarget.offer_price) : 0 } Credits</span> ablehnen?
                        </p>
                    </AlignModal.Body>
                    <AlignModal.Footer className="justify-end">
                        <AlignButton.Root variant="neutral" mode="stroke" size="small" disabled={ !!processing } onClick={ () => setRejectTarget(null) }>Abbrechen</AlignButton.Root>
                        <AlignButton.Root variant="error" mode="filled" size="small" disabled={ !!processing } onClick={ () => rejectTarget && handleReject(rejectTarget) }>
                            { processing ? 'Wird abgelehnt...' : 'Ablehnen' }
                        </AlignButton.Root>
                    </AlignModal.Footer>
                </AlignModal.Content>
            </AlignModal.Root>
        </div>
    );
};
