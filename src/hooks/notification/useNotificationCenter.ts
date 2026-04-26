import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';

export type NotificationKind =
    | 'achievement'
    | 'badge'
    | 'gift'
    | 'friend-online'
    | 'friend-offline'
    | 'pet'
    | 'respect'
    | 'mod'
    | 'system'
    | 'club'
    | 'info';

export interface NotificationCenterEntry
{
    id: string;
    kind: NotificationKind;
    title: string;
    message: string;
    iconUrl?: string;
    linkUrl?: string;
    createdAt: number;
    read: boolean;
}

const STORAGE_KEY = 'bahhos.notification-center';
const MAX_ENTRIES = 100;

const loadFromStorage = (): NotificationCenterEntry[] =>
{
    if(typeof window === 'undefined') return [];
    try
    {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw);
        if(!Array.isArray(parsed)) return [];
        return parsed.filter(n => n && typeof n.id === 'string').slice(0, MAX_ENTRIES);
    }
    catch
    {
        return [];
    }
}

const saveToStorage = (entries: NotificationCenterEntry[]) =>
{
    if(typeof window === 'undefined') return;
    try
    {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    }
    catch
    {
        // ignore quota errors
    }
}

const useNotificationCenterState = () =>
{
    const [ entries, setEntries ] = useState<NotificationCenterEntry[]>(() => loadFromStorage());
    const [ isTrayOpen, setTrayOpen ] = useState(false);

    useEffect(() =>
    {
        saveToStorage(entries);
    }, [ entries ]);

    const addEntry = useCallback((entry: Omit<NotificationCenterEntry, 'id' | 'createdAt' | 'read'> & { id?: string }) =>
    {
        const finalEntry: NotificationCenterEntry = {
            id: entry.id ?? `${ Date.now() }-${ Math.random().toString(36).slice(2, 8) }`,
            kind: entry.kind,
            title: entry.title,
            message: entry.message,
            iconUrl: entry.iconUrl,
            linkUrl: entry.linkUrl,
            createdAt: Date.now(),
            read: false,
        };

        setEntries(prev => [ finalEntry, ...prev ].slice(0, MAX_ENTRIES));
        return finalEntry;
    }, []);

    const markRead = useCallback((id: string) =>
    {
        setEntries(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback(() =>
    {
        setEntries(prev => prev.map(n => n.read ? n : { ...n, read: true }));
    }, []);

    const removeEntry = useCallback((id: string) =>
    {
        setEntries(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() =>
    {
        setEntries([]);
    }, []);

    const openTray = useCallback(() => setTrayOpen(true), []);
    const closeTray = useCallback(() => setTrayOpen(false), []);
    const toggleTray = useCallback(() => setTrayOpen(prev => !prev), []);

    return {
        entries,
        unreadCount: entries.filter(n => !n.read).length,
        isTrayOpen,
        addEntry,
        markRead,
        markAllRead,
        removeEntry,
        clearAll,
        openTray,
        closeTray,
        toggleTray,
    };
}

export const useNotificationCenter = () => useBetween(useNotificationCenterState);
