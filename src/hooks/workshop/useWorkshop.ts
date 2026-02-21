import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { AddEventLinkTracker, GetConfiguration, RemoveLinkEventTracker } from '../../api';

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

        fetch(`${ cmsUrl }/api/workshop`, { credentials: 'include' })
            .then(res => res.json())
            .then((data: WorkshopItem[]) =>
            {
                setItems(data || []);
            })
            .catch(() => setItems([]))
            .finally(() => setIsLoading(false));
    }, [ cmsUrl ]);

    const loadFeedCandidates = useCallback(() =>
    {
        if(!cmsUrl) return;

        fetch(`${ cmsUrl }/api/workshop/feed-candidates`, { credentials: 'include' })
            .then(res => res.json())
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

        try
        {
            const res = await fetch(`${ cmsUrl }/api/workshop/repair`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ itemId, type: 'credits' }),
            });

            const data = await res.json();

            if(data.success)
            {
                loadItems();
                setSelectedItem(null);
            }

            return data;
        }
        catch
        {
            return { error: 'Network error' };
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

        try
        {
            const res = await fetch(`${ cmsUrl }/api/workshop/repair`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ itemId, type: 'feed', feedItemId }),
            });

            const data = await res.json();

            if(data.success)
            {
                loadItems();
                loadFeedCandidates();
                setSelectedItem(null);
            }

            return data;
        }
        catch
        {
            return { error: 'Network error' };
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
        repairWithCredits, repairWithFeed,
        loadItems,
    };
};

export const useWorkshop = () => useBetween(useWorkshopState);
