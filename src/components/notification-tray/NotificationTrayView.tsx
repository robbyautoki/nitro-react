import { FC, useEffect, useMemo, useState } from 'react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { Award, BadgeCheck, Bell, CheckCheck, Crown, Gift, Heart, Info, MessageCircle, PawPrint, Shield, Trash2, UserMinus, Users, X } from 'lucide-react';
import { AddEventLinkTracker, CreateLinkEvent, OpenUrl, RemoveLinkEventTracker } from '../../api';
import { NotificationCenterEntry, NotificationKind, useNotificationCenter } from '../../hooks';
import * as AlignDrawer from '@/align-ui/components/ui/drawer';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import { cn } from '@/lib/utils';

type FilterId = 'all' | 'unread' | 'system' | 'achievement' | 'gift' | 'friend';

interface FilterDef {
    id: FilterId;
    label: string;
    matches: (entry: NotificationCenterEntry) => boolean;
}

const FILTERS: FilterDef[] = [
    { id: 'all',         label: 'Alle',         matches: () => true },
    { id: 'unread',      label: 'Ungelesen',    matches: (e) => !e.read },
    { id: 'system',      label: 'System',       matches: (e) => e.kind === 'system' || e.kind === 'mod' || e.kind === 'info' },
    { id: 'achievement', label: 'Achievements', matches: (e) => e.kind === 'achievement' || e.kind === 'badge' || e.kind === 'respect' },
    { id: 'gift',        label: 'Geschenke',    matches: (e) => e.kind === 'gift' || e.kind === 'club' },
    { id: 'friend',      label: 'Freunde',      matches: (e) => e.kind === 'friend-online' || e.kind === 'friend-offline' },
];

const KIND_ICON: Record<NotificationKind, { icon: FC<any>; color: string }> = {
    achievement:    { icon: Award,        color: 'text-warning-base' },
    badge:          { icon: BadgeCheck,   color: 'text-information-base' },
    gift:           { icon: Gift,         color: 'text-success-base' },
    'friend-online':{ icon: Users,        color: 'text-success-base' },
    'friend-offline':{icon: UserMinus,    color: 'text-text-soft-400' },
    pet:            { icon: PawPrint,     color: 'text-success-base' },
    respect:        { icon: Heart,        color: 'text-highlighted-base' },
    mod:            { icon: Shield,       color: 'text-error-base' },
    system:         { icon: Info,         color: 'text-information-base' },
    club:           { icon: Crown,        color: 'text-warning-base' },
    info:           { icon: MessageCircle,color: 'text-information-base' },
};

const formatRelative = (timestamp: number) =>
{
    const diff = Date.now() - timestamp;
    const sec = Math.floor(diff / 1000);
    if(sec < 60) return 'gerade eben';
    const min = Math.floor(sec / 60);
    if(min < 60) return `vor ${ min } Min.`;
    const hr = Math.floor(min / 60);
    if(hr < 24) return `vor ${ hr } Std.`;
    const day = Math.floor(hr / 24);
    if(day < 7) return `vor ${ day } Tag${ day === 1 ? '' : 'en' }`;
    return new Date(timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const groupByDay = (entries: NotificationCenterEntry[]) =>
{
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const today: NotificationCenterEntry[] = [];
    const yesterday: NotificationCenterEntry[] = [];
    const older: NotificationCenterEntry[] = [];

    for(const entry of entries)
    {
        if(entry.createdAt >= startOfToday) today.push(entry);
        else if(entry.createdAt >= startOfYesterday) yesterday.push(entry);
        else older.push(entry);
    }

    return { today, yesterday, older };
}

const DashedDivider: FC<{ className?: string }> = ({ className }) => (
    <div className={ cn('relative h-0 w-full text-stroke-soft-200', className) } role="separator">
        <div
            className="absolute left-0 h-px w-full"
            style={ {
                background:
                    'linear-gradient(90deg, currentColor 4px, transparent 4px) 50% 50% / 8px 1px repeat no-repeat',
            } }
        />
    </div>
);

interface NotificationItemProps {
    entry: NotificationCenterEntry;
    onClick: () => void;
    onRemove: () => void;
}

const NotificationItem: FC<NotificationItemProps> = ({ entry, onClick, onRemove }) =>
{
    const meta = KIND_ICON[entry.kind] ?? KIND_ICON.info;
    const Icon = meta.icon;
    const [ imageFailed, setImageFailed ] = useState(false);

    return (
        <div className="group relative">
            <button
                type="button"
                onClick={ onClick }
                className="flex w-full items-start gap-4 rounded-lg p-4 text-left transition-colors hover:bg-bg-weak-50"
            >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                    { entry.iconUrl && !imageFailed ? (
                        <img src={ entry.iconUrl } alt="" className="size-5 object-contain" onError={ () => setImageFailed(true) } />
                    ) : (
                        <Icon className={ cn('size-5', meta.color) } />
                    ) }
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h5 className="truncate text-label-sm text-text-strong-950">{ entry.title }</h5>
                            { !entry.read && (
                                <div className="size-1.5 shrink-0 rounded-full bg-primary-base" />
                            ) }
                        </div>
                        <span
                            className="line-clamp-2 text-paragraph-sm text-text-sub-600"
                            dangerouslySetInnerHTML={ { __html: entry.message.replace(/\r\n|\r|\n/g, '<br />') } }
                        />
                    </div>
                    <span className="text-label-xs text-text-soft-400">{ formatRelative(entry.createdAt) }</span>
                </div>
            </button>
            <AlignCompactButton.Root
                size="medium"
                variant="ghost"
                onClick={ (e) => { e.stopPropagation(); onRemove(); } }
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100"
                aria-label="Entfernen"
            >
                <AlignCompactButton.Icon as={ X } />
            </AlignCompactButton.Root>
        </div>
    );
}

export const NotificationTrayView: FC<{}> = () =>
{
    const { entries, unreadCount, isTrayOpen, openTray, closeTray, markRead, markAllRead, removeEntry, clearAll } = useNotificationCenter();
    const [ filter, setFilter ] = useState<FilterId>('all');
    const [ now, setNow ] = useState(Date.now());

    // Re-render relative timestamps every minute
    useEffect(() =>
    {
        const interval = window.setInterval(() => setNow(Date.now()), 60_000);
        return () => window.clearInterval(interval);
    }, []);
    void now;

    // Link-Tracker für /notifications/toggle
    useEffect(() =>
    {
        const tracker: ILinkEventTracker = {
            linkReceived: (url) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                if(parts[1] === 'toggle')
                {
                    if(isTrayOpen) closeTray(); else openTray();
                }
                else if(parts[1] === 'show') openTray();
                else if(parts[1] === 'hide') closeTray();
            },
            eventUrlPrefix: 'notifications/',
        };

        AddEventLinkTracker(tracker);

        return () => RemoveLinkEventTracker(tracker);
    }, [ isTrayOpen, openTray, closeTray ]);

    const activeFilter = FILTERS.find(f => f.id === filter) ?? FILTERS[0];
    const filtered = useMemo(() => entries.filter(activeFilter.matches), [ entries, activeFilter ]);
    const groups = useMemo(() => groupByDay(filtered), [ filtered ]);

    const handleEntryClick = (entry: NotificationCenterEntry) =>
    {
        if(!entry.read) markRead(entry.id);
        if(entry.linkUrl)
        {
            if(entry.linkUrl.startsWith('http')) OpenUrl(entry.linkUrl);
            else CreateLinkEvent(entry.linkUrl);
        }
    }

    const handleOpenChange = (open: boolean) =>
    {
        if(open) openTray(); else closeTray();
    }

    return (
        <AlignDrawer.Root open={ isTrayOpen } onOpenChange={ handleOpenChange } modal={ false }>
            <AlignDrawer.Content
                className="notification-tray-drawer w-[420px]"
                onOpenAutoFocus={ (event) => event.preventDefault() }
            >
                <AlignDrawer.Header className="px-5 pb-3 pt-4">
                    <div className="flex items-center justify-between">
                        <AlignDrawer.Title className="flex items-center gap-2 text-label-md text-text-sub-600">
                            Benachrichtigungen
                            { unreadCount > 0 && (
                                <AlignBadge.Root color="red" variant="filled" size="small">{ unreadCount }</AlignBadge.Root>
                            ) }
                        </AlignDrawer.Title>
                        <AlignDrawer.Description className="sr-only">Verlauf aller Benachrichtigungen</AlignDrawer.Description>
                        <AlignCompactButton.Root size="large" variant="ghost" onClick={ closeTray } aria-label="Schließen">
                            <AlignCompactButton.Icon as={ X } />
                        </AlignCompactButton.Root>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2">
                        <span className="text-paragraph-xs text-text-sub-600">{ entries.length } gesamt · { unreadCount } ungelesen</span>
                        <div className="flex gap-1">
                            <AlignButton.Root
                                type="button"
                                variant="neutral"
                                mode="ghost"
                                size="xxsmall"
                                className="gap-1 px-2"
                                disabled={ unreadCount === 0 }
                                onClick={ markAllRead }
                            >
                                <CheckCheck className="size-3.5" />
                                <span>Alle gelesen</span>
                            </AlignButton.Root>
                            <AlignButton.Root
                                type="button"
                                variant="neutral"
                                mode="ghost"
                                size="xxsmall"
                                className="gap-1 px-2 text-error-base"
                                disabled={ entries.length === 0 }
                                onClick={ clearAll }
                            >
                                <Trash2 className="size-3.5" />
                                <span>Leeren</span>
                            </AlignButton.Root>
                        </div>
                    </div>
                </AlignDrawer.Header>

                <div className="px-5 pb-3">
                    <div className="flex flex-wrap items-center gap-1">
                        { FILTERS.map(f => (
                            <button
                                key={ f.id }
                                type="button"
                                onClick={ () => setFilter(f.id) }
                                className={ cn(
                                    'rounded-md px-2.5 py-1 text-label-xs transition-colors',
                                    filter === f.id
                                        ? 'bg-bg-white-0 text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200'
                                        : 'text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950',
                                ) }
                            >
                                { f.label }
                            </button>
                        )) }
                    </div>
                </div>

                <div className="px-5">
                    <DashedDivider />
                </div>

                <AlignDrawer.Body className="flex flex-col gap-1 px-2 py-2">
                    { filtered.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                <Bell className="size-5 text-text-soft-400" />
                            </div>
                            <p className="text-label-sm text-text-strong-950">Nichts Neues</p>
                            <p className="px-6 text-paragraph-sm text-text-sub-600">Hier landen alle Benachrichtigungen, die du verpasst hast.</p>
                        </div>
                    ) : (
                        <>
                            { groups.today.length > 0 && (
                                <>
                                    <span className="px-4 pt-2 text-label-xs uppercase tracking-wider text-text-soft-400">Heute</span>
                                    { groups.today.map(entry => (
                                        <NotificationItem
                                            key={ entry.id }
                                            entry={ entry }
                                            onClick={ () => handleEntryClick(entry) }
                                            onRemove={ () => removeEntry(entry.id) }
                                        />
                                    )) }
                                </>
                            ) }
                            { groups.yesterday.length > 0 && (
                                <>
                                    <span className="px-4 pt-3 text-label-xs uppercase tracking-wider text-text-soft-400">Gestern</span>
                                    { groups.yesterday.map(entry => (
                                        <NotificationItem
                                            key={ entry.id }
                                            entry={ entry }
                                            onClick={ () => handleEntryClick(entry) }
                                            onRemove={ () => removeEntry(entry.id) }
                                        />
                                    )) }
                                </>
                            ) }
                            { groups.older.length > 0 && (
                                <>
                                    <span className="px-4 pt-3 text-label-xs uppercase tracking-wider text-text-soft-400">Älter</span>
                                    { groups.older.map(entry => (
                                        <NotificationItem
                                            key={ entry.id }
                                            entry={ entry }
                                            onClick={ () => handleEntryClick(entry) }
                                            onRemove={ () => removeEntry(entry.id) }
                                        />
                                    )) }
                                </>
                            ) }
                        </>
                    ) }
                </AlignDrawer.Body>
            </AlignDrawer.Content>
        </AlignDrawer.Root>
    );
}
