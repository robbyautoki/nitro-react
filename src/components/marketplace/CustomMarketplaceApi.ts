import { GetConfiguration, getAuthHeaders } from '../../api';

const getCmsUrl = () => GetConfiguration<string>('url.prefix', '');
const headers = () => getAuthHeaders();

export const CustomMarketplaceApi = {
    browse: (params?: { q?: string; minPrice?: number; maxPrice?: number; currency?: string; page?: number }) =>
    {
        const sp = new URLSearchParams({ action: 'browse' });
        if(params?.q) sp.set('q', params.q);
        if(params?.minPrice && params.minPrice > 0) sp.set('minPrice', String(params.minPrice));
        if(params?.maxPrice && params.maxPrice > 0) sp.set('maxPrice', String(params.maxPrice));
        if(params?.currency) sp.set('currency', params.currency);
        if(params?.page) sp.set('page', String(params.page));
        return fetch(`${ getCmsUrl() }/api/marketplace?${ sp }`, { headers: headers() }).then(r => r.json());
    },

    myListings: () =>
        fetch(`${ getCmsUrl() }/api/marketplace?action=my-listings`, { headers: headers() }).then(r => r.json()),

    mySales: () =>
        fetch(`${ getCmsUrl() }/api/marketplace?action=my-sales`, { headers: headers() }).then(r => r.json()),

    myPurchases: () =>
        fetch(`${ getCmsUrl() }/api/marketplace?action=my-purchases`, { headers: headers() }).then(r => r.json()),

    myOffersReceived: () =>
        fetch(`${ getCmsUrl() }/api/marketplace?action=my-offers-received`, { headers: headers() }).then(r => r.json()),

    inventory: () =>
        fetch(`${ getCmsUrl() }/api/marketplace?action=inventory`, { headers: headers() }).then(r => r.json()),

    createListing: (data: { item_ids: number[]; price: number; currency: string; duration_days: number; note?: string }) =>
        fetch(`${ getCmsUrl() }/api/marketplace`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ action: 'create-listing', ...data }),
        }).then(r => r.json()),

    cancelListing: (listing_id: number) =>
        fetch(`${ getCmsUrl() }/api/marketplace`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ action: 'cancel-listing', listing_id }),
        }).then(r => r.json()),

    buy: (listing_id: number) =>
        fetch(`${ getCmsUrl() }/api/marketplace`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ action: 'buy', listing_id }),
        }).then(r => r.json()),

    makeOffer: (listing_id: number, offer_price: number) =>
        fetch(`${ getCmsUrl() }/api/marketplace`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ action: 'make-offer', listing_id, offer_price }),
        }).then(r => r.json()),

    acceptOffer: (offer_id: number) =>
        fetch(`${ getCmsUrl() }/api/marketplace`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ action: 'accept-offer', offer_id }),
        }).then(r => r.json()),

    rejectOffer: (offer_id: number) =>
        fetch(`${ getCmsUrl() }/api/marketplace`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ action: 'reject-offer', offer_id }),
        }).then(r => r.json()),

    itemInfo: (item_base_id: number, item_id?: number) =>
    {
        const sp = new URLSearchParams({ action: 'item-info', item_base_id: String(item_base_id) });
        if(item_id) sp.set('item_id', String(item_id));
        return fetch(`${ getCmsUrl() }/api/marketplace?${ sp }`, { headers: headers() }).then(r => r.json());
    },
};
