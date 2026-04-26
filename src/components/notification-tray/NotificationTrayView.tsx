import { FC, useEffect, useMemo, useState } from 'react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { Award, BadgeCheck, Bell, CheckCheck, Crown, Gift, Heart, Info, MessageCircle, PawPrint, Shield, Trash2, UserMinus, Users, X } from 'lucide-react';
import { AddEventLinkTracker, CreateLinkEvent, OpenUrl, RemoveLinkEventTracker } from '../../api';
import { NotificationCenterEntry, NotificationKind, useNotificationCenter } from '../../hooks';
import * as AlignDrawer from '@/align-ui/components/ui/drawer';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import { cn } from '@/align-ui/utils/cn';

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
        <button
            type="button"
            onClick={ onClick }
            className={ cn(
                'group relative flex w-full items-start gap-3 rounded-12 border px-3 py-2.5 text-left transition-colors',
                'hover:bg-bg-white-0',
                entry.read
                    ? 'border-stroke-soft-200 bg-bg-weak-50'
                    : 'border-primary-base/30 bg-primary-base/10',
            ) }
        >
            { !entry.read && (
                <span className="absolute left-2 top-2 size-2 rounded-full bg-primary-base shadow-sm" />
            ) }
            <div className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-weak-50">
                { entry.iconUrl && !imageFailed ? (
                    <img src={ entry.iconUrl } alt="" className="size-5 object-contain" onError={ () => setImageFailed(true) } />
                ) : (
                    <Icon className={ cn('size-4', meta.color) } />
                ) }
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-label-xs font-semibold text-text-strong-950">{ entry.title }</span>
                    <span className="shrink-0 text-paragraph-2xs text-text-soft-400">{ formatRelative(entry.createdAt) }</span>
                </div>
                <p
                    className="mt-0.5 line-clamp-2 text-paragraph-xs text-text-sub-600"
                    dangerouslySetInnerHTML={ { __html: entry.message.replace(/\r\n|\r|\n/g, '<br />') } }
                />
            </div>
            <button
                type="button"
                onClick={ (e) => { e.stopPropagation(); onRemove(); } }
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full text-text-soft-400 opacity-0 transition-opacity hover:bg-bg-weak-50 hover:text-text-sub-600 group-hover:opacity-100"
                aria-label="Entfernen"
            >
                <X className="size-3.5" />
            </button>
        </button>
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
                <AlignDrawer.Header className="px-4 pb-2 pt-3">
                    <div className="flex items-center justify-between">
                        <AlignDrawer.Title className="flex items-center gap-2 text-label-md text-text-strong-950">
                            <Bell className="size-4 text-text-sub-600" />
                            Benachrichtigungen
                            { unreadCount > 0 && (
                                <AlignBadge.Root color="red" variant="filled" size="small">{ unreadCount }</AlignBadge.Root>
                            ) }
                        </AlignDrawer.Title>
                        <AlignDrawer.Description className="sr-only">Verlauf aller Benachrichtigungen</AlignDrawer.Description>
                        <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ closeTray }>
                            <AlignButton.Icon as={ X } className="size-4" />
                        </AlignButton.Root>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2">
                        <span className="text-paragraph-2xs text-text-sub-600">{ entries.length } gesamt · { unreadCount } ungelesen</span>
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

                <div className="px-4 pb-2">
                    <div className="flex flex-wrap items-center gap-1 rounded-12 bg-bg-weak-50 p-1">
                        { FILTERS.map(f => (
                            <button
                                key={ f.id }
                                type="button"
                                onClick={ () => setFilter(f.id) }
                                className={ cn(
                                    'rounded-8 px-2.5 py-1 text-label-2xs transition-colors',
                                    filter === f.id
                                        ? 'bg-bg-white-0 text-text-strong-950 shadow-regular-xs'
                                        : 'text-text-sub-600 hover:text-text-strong-950',
                                ) }
                            >
                                { f.label }
                            </button>
                        )) }
                    </div>
                </div>

                <AlignDivider.Root className="mx-4" />

                <AlignDrawer.Body className="flex flex-col gap-2 px-3 py-3">
                    { filtered.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-bg-weak-50">
                                <Bell className="size-5 text-text-soft-400" />
                            </div>
                            <p className="text-label-sm text-text-strong-950">Nichts Neues</p>
                            <p className="px-6 text-paragraph-xs text-text-sub-600">Hier landen alle Benachrichtigungen, die du verpasst hast.</p>
                        </div>
                    ) : (
                        <>
                            { groups.today.length > 0 && (
                                <>
                                    <span className="px-2 pt-1 text-label-2xs uppercase tracking-wider text-text-soft-400">Heute</span>
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
                                    <span className="px-2 pt-2 text-label-2xs uppercase tracking-wider text-text-soft-400">Gestern</span>
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
                                    <span className="px-2 pt-2 text-label-2xs uppercase tracking-wider text-text-soft-400">Älter</span>
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
