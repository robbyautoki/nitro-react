import { ReactNode, useEffect, useState } from 'react';

export type TopbarBannerKind = 'room-entry' | 'arrest' | 'jail-timer' | 'broadcast' | 'custom';

export type TopbarBanner = {
    /** Stable id — same id replaces an existing banner instead of stacking. */
    id: string;
    kind: TopbarBannerKind;
    /** Lower number = higher in the stack. */
    priority: number;
    /** Optional auto-dismiss in ms. */
    ttl?: number;
    content: ReactNode;
};

type Listener = (banners: TopbarBanner[]) => void;

class TopbarBannerStore
{
    private banners: TopbarBanner[] = [];
    private listeners = new Set<Listener>();
    private ttlTimers = new Map<string, ReturnType<typeof setTimeout>>();

    subscribe(listener: Listener): () => void
    {
        this.listeners.add(listener);
        listener(this.banners);
        return () => { this.listeners.delete(listener); };
    }

    push(banner: TopbarBanner): void
    {
        // Replace existing banner with same id (idempotent against doubled events)
        const idx = this.banners.findIndex(b => b.id === banner.id);
        if(idx >= 0) this.banners[idx] = banner;
        else this.banners = [ ...this.banners, banner ];

        this.banners = [ ...this.banners ].sort((a, b) => a.priority - b.priority);

        const existingTimer = this.ttlTimers.get(banner.id);
        if(existingTimer)
        {
            clearTimeout(existingTimer);
            this.ttlTimers.delete(banner.id);
        }

        if(banner.ttl && banner.ttl > 0)
        {
            const t = setTimeout(() => this.remove(banner.id), banner.ttl);
            this.ttlTimers.set(banner.id, t);
        }

        this.emit();
    }

    remove(id: string): void
    {
        const idx = this.banners.findIndex(b => b.id === id);
        if(idx < 0) return;

        this.banners = this.banners.filter(b => b.id !== id);

        const t = this.ttlTimers.get(id);
        if(t) { clearTimeout(t); this.ttlTimers.delete(id); }

        this.emit();
    }

    removeByKind(kind: TopbarBannerKind): void
    {
        const ids = this.banners.filter(b => b.kind === kind).map(b => b.id);
        ids.forEach(id => this.remove(id));
    }

    private emit(): void
    {
        const snapshot = this.banners;
        this.listeners.forEach(l => l(snapshot));
    }
}

const store = new TopbarBannerStore();

export const TopbarBannerStack = {
    push: (banner: TopbarBanner) => store.push(banner),
    remove: (id: string) => store.remove(id),
    removeByKind: (kind: TopbarBannerKind) => store.removeByKind(kind)
};

export const useTopbarBanners = (): TopbarBanner[] =>
{
    const [ banners, setBanners ] = useState<TopbarBanner[]>([]);

    useEffect(() => store.subscribe(setBanners), []);

    return banners;
};
