import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { AddEventLinkTracker, GetConfiguration, RemoveLinkEventTracker, getAuthHeaders } from '../../api';

export interface WorkshopItem
{
    itemId: number;
    itemBaseId: number;
    spriteId: number;
    itemName: string;
    internalName: string;
    durabilityRemaining: number;
    status: string;
    maxDays: number;
    graceExpiresAt: string | null;
    inRoom: boolean;
    tradeValue: number;
    repairCost: number;
    feedValuePercent: number;
}

export interface FeedCandidate
{
    itemId: number;
    itemBaseId: number;
    itemName: string;
    internalName: string;
    spriteId: number;
    tradeValue: number;
}

const useWorkshopState = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentTab, setCurrentTab ] = useState<string>('items');
    const [ items, setItems ] = useState<WorkshopItem[]>([]);
    const [ feedCandidates, setFeedCandidates ] = useState<FeedCandidate[]>([]);
    const [ selectedItem, setSelectedItem ] = useState<WorkshopItem | null>(null);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ isRepairing, setIsRepairing ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const [ lastRepairResult, setLastRepairResult ] = useState<Record<string, unknown> | null>(null);

    const cmsUrl = GetConfiguration<string>('url.prefix', '');

    // Link event tracker
    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                }
            },
            eventUrlPrefix: 'workshop/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    // Load items when visible
    const loadItems = useCallback(() =>
    {
        if(!cmsUrl) return;

        setIsLoading(true);
        setError(null);

        fetch(`${ cmsUrl }/api/workshop`, { headers: getAuthHeaders() })
            .then(async res =>
            {
                const data = await res.json().catch(() => null);
                if(!res.ok) throw new Error(data?.error || 'Werkstatt konnte nicht geladen werden');
                return data;
            })
            .then((data: WorkshopItem[]) =>
            {
                setItems(data || []);
            })
            .catch(error =>
            {
                setItems([]);
                setError(error instanceof Error ? error.message : 'Werkstatt konnte nicht geladen werden');
            })
            .finally(() => setIsLoading(false));
    }, [ cmsUrl ]);

    const loadFeedCandidates = useCallback(() =>
    {
        if(!cmsUrl) return;

        fetch(`${ cmsUrl }/api/workshop/feed-candidates`, { headers: getAuthHeaders() })
            .then(async res =>
            {
                const data = await res.json().catch(() => null);
                if(!res.ok) throw new Error(data?.error || 'Futter-Items konnten nicht geladen werden');
                return data;
            })
            .then((data: FeedCandidate[]) =>
            {
                setFeedCandidates(data || []);
            })
            .catch(() => setFeedCandidates([]));
    }, [ cmsUrl ]);

    useEffect(() =>
    {
        if(isVisible)
        {
            loadItems();
            loadFeedCandidates();
        }
    }, [ isVisible, loadItems, loadFeedCandidates ]);

    // Repair with credits
    const repairWithCredits = useCallback(async (itemId: number) =>
    {
        if(!cmsUrl || isRepairing) return;

        setIsRepairing(true);
        setError(null);
        setLastRepairResult(null);

        try
        {
            const res = await fetch(`${ cmsUrl }/api/workshop/repair`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ itemId, type: 'credits' }),
            });

            const data = await res.json();
            setLastRepairResult(data);

            if(data.success)
            {
                loadItems();
                setSelectedItem(null);
            }

            return data;
        }
        catch(error)
        {
            const result = { error: error instanceof Error ? error.message : 'Network error' };
            setError(result.error);
            setLastRepairResult(result);
            return result;
        }
        finally
        {
            setIsRepairing(false);
        }
    }, [ cmsUrl, isRepairing, loadItems ]);

    // Repair with feed
    const repairWithFeed = useCallback(async (itemId: number, feedItemId: number) =>
    {
        if(!cmsUrl || isRepairing) return;

        setIsRepairing(true);
        setError(null);
        setLastRepairResult(null);

        try
        {
            const res = await fetch(`${ cmsUrl }/api/workshop/repair`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ itemId, type: 'feed', feedItemId }),
            });

            const data = await res.json();
            setLastRepairResult(data);

            if(data.success)
            {
                loadItems();
                loadFeedCandidates();
                setSelectedItem(null);
            }

            return data;
        }
        catch(error)
        {
            const result = { error: error instanceof Error ? error.message : 'Network error' };
            setError(result.error);
            setLastRepairResult(result);
            return result;
        }
        finally
        {
            setIsRepairing(false);
        }
    }, [ cmsUrl, isRepairing, loadItems, loadFeedCandidates ]);

    return {
        isVisible, setIsVisible,
        currentTab, setCurrentTab,
        items, feedCandidates,
        selectedItem, setSelectedItem,
        isLoading, isRepairing,
        error, setError,
        lastRepairResult,
        repairWithCredits, repairWithFeed,
        loadItems,
    };
};

export const useWorkshop = () => useBetween(useWorkshopState);
