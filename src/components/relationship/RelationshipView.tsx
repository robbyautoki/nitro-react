import { FC, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Handshake, Heart, Info, Mail, MessageCircle, Swords, Trash2, Trophy, Users } from 'lucide-react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, GetConfiguration, GetSessionDataManager, RemoveLinkEventTracker, getAuthHeaders } from '../../api';
import { LayoutAvatarImageView } from '../../common';
import { AlignGameConfirm, AlignGameWindow, EmptyState, MetricTile, SelectableCard } from '../align-game-ui';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';
import * as AlignTable from '@/align-ui/components/ui/table';

interface RelData
{
    other_id: number;
    other_username: string;
    other_look: string;
    points: number;
    level: number;
    level_name: string;
    next_level_points: number | null;
    chat_points: number;
    whisper_points: number;
    trade_points: number;
    action_points: number;
    pm_points: number;
    event_points: number;
    friends_since?: number | null;
}

const LEVEL_STYLES = [
    { stars: 'text-faded-base', progress: 'blue' as const },
    { stars: 'text-text-soft-400', progress: 'blue' as const },
    { stars: 'text-information-base', progress: 'blue' as const },
    { stars: 'text-success-base', progress: 'green' as const },
    { stars: 'text-warning-base', progress: 'orange' as const },
    { stars: 'text-warning-dark', progress: 'orange' as const },
    { stars: 'text-error-base', progress: 'red' as const },
    { stars: 'text-feature-base', progress: 'blue' as const },
];

const LEVEL_TABLE = [
    { level: 0, name: 'Unbekannt', points: 0, stars: '☆☆☆☆☆☆☆' },
    { level: 1, name: 'Bekannte', points: 50, stars: '★☆☆☆☆☆☆' },
    { level: 2, name: 'Kumpel', points: 150, stars: '★★☆☆☆☆☆' },
    { level: 3, name: 'Guter Freund', points: 400, stars: '★★★☆☆☆☆' },
    { level: 4, name: 'Bester Freund', points: 800, stars: '★★★★☆☆☆' },
    { level: 5, name: 'Seelenverwandt', points: 1500, stars: '★★★★★☆☆' },
    { level: 6, name: 'Unzertrennlich', points: 3000, stars: '★★★★★★☆' },
    { level: 7, name: 'Legende', points: 5000, stars: '★★★★★★★' },
];

const ACTION_TABLE = [
    { action: 'Chat im Raum', points: '+1', cooldown: '30s' },
    { action: 'Flüstern', points: '+2', cooldown: '30s' },
    { action: 'Handeln', points: '+10', cooldown: '-' },
    { action: 'Küssen (:kiss)', points: '+5', cooldown: '2min' },
    { action: 'Umarmen (:hug)', points: '+3', cooldown: '2min' },
    { action: 'Hauen (:hit)', points: '+1', cooldown: '2min' },
    { action: 'Private Nachricht', points: '+2', cooldown: '60s' },
    { action: 'Event (2v2)', points: '+25', cooldown: '-' },
];

const STAT_ITEMS = [
    { key: 'chat_points', label: 'Chat', icon: MessageCircle, className: 'text-information-base' },
    { key: 'whisper_points', label: 'Flüstern', icon: Eye, className: 'text-feature-base' },
    { key: 'trade_points', label: 'Handel', icon: Handshake, className: 'text-warning-base' },
    { key: 'action_points', label: 'Aktionen', icon: Swords, className: 'text-error-base' },
    { key: 'pm_points', label: 'Nachrichten', icon: Mail, className: 'text-success-base' },
    { key: 'event_points', label: 'Events', icon: Trophy, className: 'text-away-base' },
];

const getCmsUrl = () => GetConfiguration<string>('url.prefix', '');

const fetchApi = (action: string, extra = '') =>
    fetch(`${ getCmsUrl() }/api/relationships?action=${ action }${ extra }`, {
        headers: getAuthHeaders(),
    }).then(r => r.json());

const postApi = (body: object) =>
    fetch(`${ getCmsUrl() }/api/relationships`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(r => r.json());

export const RelationshipView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ relationships, setRelationships ] = useState<RelData[]>([]);
    const [ selectedRel, setSelectedRel ] = useState<RelData | null>(null);
    const [ loading, setLoading ] = useState(false);
    const [ showInfo, setShowInfo ] = useState(false);
    const [ pendingUsername, setPendingUsername ] = useState<string | null>(null);
    const [ deleteTarget, setDeleteTarget ] = useState<RelData | null>(null);

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
                        if(parts.length >= 3 && parts[2])
                        {
                            setPendingUsername(parts[2]);
                        }
                        else
                        {
                            setPendingUsername(null);
                        }
                        setIsVisible(true);
                        return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(prev => !prev); return;
                }
            },
            eventUrlPrefix: 'relationship/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!isVisible) return;
        setLoading(true);
        setSelectedRel(null);

        if(pendingUsername)
        {
            Promise.all([
                fetchApi('top'),
                fetchApi('detail', `&username=${ encodeURIComponent(pendingUsername) }`),
            ])
                .then(([ topData, detailData ]) =>
                {
                    setRelationships(Array.isArray(topData) ? topData : []);
                    if(detailData && detailData.other_username) setSelectedRel(detailData);
                })
                .catch(() => setRelationships([]))
                .finally(() =>
                {
                    setLoading(false); setPendingUsername(null);
                });
        }
        else
        {
            fetchApi('top')
                .then(data => setRelationships(Array.isArray(data) ? data : []))
                .catch(() => setRelationships([]))
                .finally(() => setLoading(false));
        }
    }, [ isVisible ]); // eslint-disable-line react-hooks/exhaustive-deps

    const onClose = useCallback(() => setIsVisible(false), []);

    const confirmDelete = useCallback(async () =>
    {
        if(!deleteTarget) return;
        await postApi({ action: 'delete', targetId: deleteTarget.other_id });
        setDeleteTarget(null);
        setSelectedRel(null);
        setLoading(true);
        fetchApi('top')
            .then(data => setRelationships(Array.isArray(data) ? data : []))
            .catch(() => setRelationships([]))
            .finally(() => setLoading(false));
    }, [ deleteTarget ]);

    if(!isVisible) return null;

    const renderStars = (level: number) =>
    {
        const filled = '★'.repeat(level);
        const empty = '☆'.repeat(7 - level);
        return (
            <span className={ LEVEL_STYLES[level]?.stars || 'text-text-soft-400' }>
                { filled }{ empty }
            </span>
        );
    };

    const renderProgress = (rel: RelData) =>
    {
        if(!rel.next_level_points) return <AlignBadge.Root color="purple" variant="lighter" size="small">MAX LEVEL</AlignBadge.Root>;
        const prevThreshold = [ 0, 50, 150, 400, 800, 1500, 3000, 5000 ][rel.level] || 0;
        const progress = ((rel.points - prevThreshold) / (rel.next_level_points - prevThreshold)) * 100;
        return (
            <div className="flex w-full items-center gap-2">
                <AlignProgress.Root value={ Math.min(100, Math.max(0, progress)) } color={ LEVEL_STYLES[rel.level]?.progress || 'blue' } />
                <span className="shrink-0 text-subheading-2xs tabular-nums text-text-soft-400">{ rel.points }/{ rel.next_level_points }</span>
            </div>
        );
    };

    const renderInfoPanel = () => (
        <div className="space-y-3">
            <div className="rounded-xl border border-stroke-soft-200 bg-bg-weak-50 p-3 text-paragraph-xs leading-relaxed text-text-sub-600">
                <p>
                    Das Beziehungssystem trackt automatisch deine Interaktionen mit Freunden. Je mehr ihr miteinander chattet,
                    handelt und interagiert, desto stärker wird eure Bindung. Höhere Level schalten besondere Titel frei.
                </p>
                <p className="mt-2">
                    <span className="font-medium text-text-strong-950">Wichtig:</span> Beziehungspunkte können nur mit Freunden gesammelt werden.
                    Beziehungen können entfernt werden; das gilt für beide Seiten.
                </p>
            </div>
            <section className="space-y-2">
                <div className="text-label-xs uppercase text-text-soft-400">Punkte pro Aktion</div>
                <AlignTable.Root>
                    <AlignTable.Header>
                        <AlignTable.Row>
                            <AlignTable.Head>Aktion</AlignTable.Head>
                            <AlignTable.Head>Punkte</AlignTable.Head>
                            <AlignTable.Head>Cooldown</AlignTable.Head>
                        </AlignTable.Row>
                    </AlignTable.Header>
                    <AlignTable.Body spacing={ 6 }>
                        { ACTION_TABLE.map(row => (
                            <AlignTable.Row key={ row.action }>
                                <AlignTable.Cell className="h-9 text-paragraph-xs text-text-strong-950">{ row.action }</AlignTable.Cell>
                                <AlignTable.Cell className="h-9 text-label-xs text-success-base">{ row.points }</AlignTable.Cell>
                                <AlignTable.Cell className="h-9 text-paragraph-xs text-text-sub-600">{ row.cooldown }</AlignTable.Cell>
                            </AlignTable.Row>
                        )) }
                    </AlignTable.Body>
                </AlignTable.Root>
            </section>
            <section className="space-y-2">
                <div className="text-label-xs uppercase text-text-soft-400">Level-Stufen</div>
                <AlignTable.Root>
                    <AlignTable.Header>
                        <AlignTable.Row>
                            <AlignTable.Head>Level</AlignTable.Head>
                            <AlignTable.Head>Titel</AlignTable.Head>
                            <AlignTable.Head>Punkte</AlignTable.Head>
                        </AlignTable.Row>
                    </AlignTable.Header>
                    <AlignTable.Body spacing={ 6 }>
                        { LEVEL_TABLE.map(row => (
                            <AlignTable.Row key={ row.level }>
                                <AlignTable.Cell className={ `h-9 text-paragraph-xs ${ LEVEL_STYLES[row.level]?.stars || 'text-text-soft-400' }` }>{ row.stars }</AlignTable.Cell>
                                <AlignTable.Cell className="h-9 text-paragraph-xs text-text-strong-950">{ row.name }</AlignTable.Cell>
                                <AlignTable.Cell className="h-9 text-paragraph-xs tabular-nums text-text-sub-600">{ row.points.toLocaleString() }</AlignTable.Cell>
                            </AlignTable.Row>
                        )) }
                    </AlignTable.Body>
                </AlignTable.Root>
            </section>
        </div>
    );

    const title = selectedRel ? (
        <div className="flex min-w-0 items-center gap-2">
            <AlignButton.Root
                type="button"
                variant="neutral"
                mode="ghost"
                size="xxsmall"
                className="size-7 shrink-0 p-0"
                onClick={ () => setSelectedRel(null) }
                onMouseDown={ event => event.stopPropagation() }
            >
                <AlignButton.Icon as={ ArrowLeft } className="size-4" />
            </AlignButton.Root>
            <span className="truncate">{ selectedRel.other_username }</span>
        </div>
    ) : 'Beziehungen';

    return (
        <>
            <AlignGameWindow
                uniqueKey="relationship"
                title={ title }
                subtitle={ selectedRel ? selectedRel.level_name : `${ relationships.length } Beziehungen` }
                icon={ selectedRel ? undefined : <Users className="size-4" /> }
                widthClassName="w-[500px] max-w-[94vw]"
                bodyClassName="space-y-3"
                onClose={ onClose }
            >
                { loading && <EmptyState title="Laden..." description="Beziehungsdaten werden abgerufen." /> }
                { !loading && selectedRel && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-6 py-2">
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex h-20 w-16 items-center justify-center overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-weak-50">
                                    <LayoutAvatarImageView figure={ GetSessionDataManager().figure } direction={ 2 } />
                                </div>
                                <span className="max-w-24 truncate text-paragraph-xs text-text-sub-600">{ GetSessionDataManager().userName }</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-center">
                                <div className="text-label-lg">{ renderStars(selectedRel.level) }</div>
                                <AlignBadge.Root color="purple" variant="lighter" size="small">{ selectedRel.level_name }</AlignBadge.Root>
                                <span className="text-subheading-2xs text-text-soft-400">Level { selectedRel.level }</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex h-20 w-16 items-center justify-center overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-weak-50">
                                    <LayoutAvatarImageView figure={ selectedRel.other_look } direction={ 4 } />
                                </div>
                                <span className="max-w-24 truncate text-paragraph-xs text-text-sub-600">{ selectedRel.other_username }</span>
                            </div>
                        </div>
                        { selectedRel.friends_since && (
                            <div className="rounded-xl bg-bg-weak-50 px-3 py-2 text-center text-paragraph-xs text-text-sub-600">
                                Freunde seit { new Date(selectedRel.friends_since * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) }
                            </div>
                        ) }
                        { renderProgress(selectedRel) }
                        <div className="grid grid-cols-3 gap-2">
                            { STAT_ITEMS.map(stat =>
                            {
                                const Icon = stat.icon;
                                const val = (selectedRel as any)[stat.key] ?? 0;
                                return (
                                    <MetricTile
                                        key={ stat.key }
                                        icon={ <Icon className={ `size-4 ${ stat.className }` } /> }
                                        value={ val.toLocaleString() }
                                        label={ stat.label }
                                    />
                                );
                            }) }
                        </div>
                        <MetricTile
                            icon={ <Heart className="size-4 text-highlighted-base" /> }
                            value={ `${ selectedRel.points.toLocaleString() } Punkte` }
                            label="Gesamt"
                        />
                    </div>
                ) }
                { !loading && !selectedRel && (
                    <div className="space-y-3">
                        <div className="flex rounded-xl bg-bg-weak-50 p-1">
                            <AlignButton.Root
                                type="button"
                                variant="neutral"
                                mode={ !showInfo ? 'stroke' : 'ghost' }
                                size="xxsmall"
                                className="flex-1"
                                onClick={ () => setShowInfo(false) }
                            >
                                <Users className="size-3.5" />
                                Ranking
                            </AlignButton.Root>
                            <AlignButton.Root
                                type="button"
                                variant="neutral"
                                mode={ showInfo ? 'stroke' : 'ghost' }
                                size="xxsmall"
                                className="flex-1"
                                onClick={ () => setShowInfo(true) }
                            >
                                <Info className="size-3.5" />
                                Info
                            </AlignButton.Root>
                        </div>
                        { showInfo && renderInfoPanel() }
                        { relationships.length === 0 && !showInfo && (
                            <div className="space-y-3">
                                <EmptyState icon={ <Heart className="size-10" /> } title="Noch keine Beziehungen" description="Interaktionen mit Freunden füllen diese Liste." />
                                { renderInfoPanel() }
                            </div>
                        ) }
                        { relationships.length > 0 && !showInfo && (
                            <div className="space-y-2">
                                { relationships.map((rel, index) => (
                                    <SelectableCard
                                        key={ rel.other_id }
                                        as="div"
                                        role="button"
                                        tabIndex={ 0 }
                                        className="cursor-pointer"
                                        onClick={ () => setSelectedRel(rel) }
                                        onKeyDown={ event =>
                                        {
                                            if(event.key === 'Enter') setSelectedRel(rel);
                                        } }
                                    >
                                        <span className="w-5 shrink-0 text-center text-subheading-2xs tabular-nums text-text-soft-400">{ index + 1 }</span>
                                        <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                            <div className="absolute left-[-24px] top-[-22px]">
                                                <LayoutAvatarImageView figure={ rel.other_look } direction={ 2 } headOnly={ true } />
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-label-sm text-text-strong-950">{ rel.other_username }</div>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <span className="text-paragraph-xs">{ renderStars(rel.level) }</span>
                                                <span className={ `text-subheading-2xs ${ LEVEL_STYLES[rel.level]?.stars || 'text-text-soft-400' }` }>{ rel.level_name }</span>
                                            </div>
                                            <div className="mt-1">{ renderProgress(rel) }</div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="text-label-xs tabular-nums text-text-strong-950">{ rel.points.toLocaleString() }</div>
                                            <div className="text-subheading-2xs text-text-soft-400">Punkte</div>
                                        </div>
                                        <AlignButton.Root
                                            type="button"
                                            variant="error"
                                            mode="ghost"
                                            size="xxsmall"
                                            className="size-7 shrink-0 p-0"
                                            aria-label="Beziehung entfernen"
                                            onClick={ event =>
                                            {
                                                event.stopPropagation(); setDeleteTarget(rel);
                                            } }
                                        >
                                            <AlignButton.Icon as={ Trash2 } className="size-3.5" />
                                        </AlignButton.Root>
                                    </SelectableCard>
                                )) }
                            </div>
                        ) }
                    </div>
                ) }
            </AlignGameWindow>
            <AlignGameConfirm
                open={ !!deleteTarget }
                title="Beziehung entfernen?"
                description={ (
                    <span>
                        Die Beziehung mit <span className="font-medium text-text-strong-950">{ deleteTarget?.other_username }</span> wird für beide Seiten gelöscht.
                        Punkte sammeln ist erst wieder als Freunde möglich.
                    </span>
                ) }
                confirmLabel="Entfernen"
                destructive
                onCancel={ () => setDeleteTarget(null) }
                onConfirm={ confirmDelete }
            />
        </>
    );
};
