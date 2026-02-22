import { FC, useCallback, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Heart, ArrowLeft, MessageCircle, Eye, Handshake, Swords, Mail, Trophy, Info, Users } from 'lucide-react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, GetConfiguration, GetSessionDataManager, RemoveLinkEventTracker, getAuthHeaders } from '../../api';
import { DraggableWindow, DraggableWindowPosition, LayoutAvatarImageView } from '../../common';

const LEVEL_NAMES = ['Unbekannt', 'Bekannte', 'Kumpel', 'Guter Freund', 'Bester Freund', 'Seelenverwandt', 'Unzertrennlich', 'Legende'];
const LEVEL_COLORS = ['#666', '#999', '#6bb5ff', '#4ade80', '#facc15', '#f97316', '#ef4444', '#c084fc'];

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

const getCmsUrl = () => GetConfiguration<string>('url.prefix', '');

const fetchApi = (action: string, extra = '') =>
    fetch(`${ getCmsUrl() }/api/relationships?action=${ action }${ extra }`, {
        headers: getAuthHeaders(),
    }).then(r => r.json());

export const RelationshipView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ relationships, setRelationships ] = useState<RelData[]>([]);
    const [ selectedRel, setSelectedRel ] = useState<RelData | null>(null);
    const [ loading, setLoading ] = useState(false);
    const [ showInfo, setShowInfo ] = useState(false);
    const [ pendingUsername, setPendingUsername ] = useState<string | null>(null);

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

    // Load data when visible
    useEffect(() =>
    {
        if(!isVisible) return;
        setLoading(true);
        setSelectedRel(null);

        if(pendingUsername)
        {
            // Load detail for specific user
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
                .finally(() => { setLoading(false); setPendingUsername(null); });
        }
        else
        {
            fetchApi('top')
                .then(data => setRelationships(Array.isArray(data) ? data : []))
                .catch(() => setRelationships([]))
                .finally(() => setLoading(false));
        }
    }, [ isVisible ]);

    const onClose = useCallback(() => setIsVisible(false), []);

    const selectDetail = (rel: RelData) =>
    {
        setSelectedRel(rel);
    };

    if(!isVisible) return null;

    const renderStars = (level: number) =>
    {
        const filled = '★'.repeat(level);
        const empty = '☆'.repeat(7 - level);
        return (
            <span style={{ color: LEVEL_COLORS[level] || '#666', letterSpacing: 1 }}>
                { filled }{ empty }
            </span>
        );
    };

    const renderProgress = (rel: RelData) =>
    {
        if(!rel.next_level_points) return <span className="text-[10px] text-purple-300/60">MAX LEVEL</span>;
        const prevThreshold = [0, 50, 150, 400, 800, 1500, 3000, 5000][rel.level] || 0;
        const progress = ((rel.points - prevThreshold) / (rel.next_level_points - prevThreshold)) * 100;
        return (
            <div className="flex items-center gap-2 w-full">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${ Math.min(100, Math.max(0, progress)) }%`, background: LEVEL_COLORS[rel.level] || '#666' }}
                    />
                </div>
                <span className="text-[10px] text-white/30 shrink-0">{ rel.points }/{ rel.next_level_points }</span>
            </div>
        );
    };

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

    const renderInfoPanel = () => (
        <div className="flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-pink-500/[0.05] border border-pink-500/10">
                <p className="text-[11px] text-white/60 leading-relaxed">
                    Das Beziehungssystem trackt automatisch deine Interaktionen mit anderen Usern.
                    Je mehr ihr miteinander chattet, handelt und interagiert, desto stärker wird eure Bindung.
                    Höhere Level schalten besondere Titel frei.
                </p>
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-white/50">Punkte pro Aktion</span>
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                    <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                        <div className="px-2.5 py-1.5 bg-white/[0.04] text-[10px] font-semibold text-white/40">Aktion</div>
                        <div className="px-2.5 py-1.5 bg-white/[0.04] text-[10px] font-semibold text-white/40">Punkte</div>
                        <div className="px-2.5 py-1.5 bg-white/[0.04] text-[10px] font-semibold text-white/40">Cooldown</div>
                        { ACTION_TABLE.map((row, i) => (
                            <div key={ i } className="contents">
                                <div className="px-2.5 py-1.5 bg-[rgba(12,12,16,0.97)] text-[10px] text-white/60">{ row.action }</div>
                                <div className="px-2.5 py-1.5 bg-[rgba(12,12,16,0.97)] text-[10px] text-emerald-400/70 font-medium">{ row.points }</div>
                                <div className="px-2.5 py-1.5 bg-[rgba(12,12,16,0.97)] text-[10px] text-white/30">{ row.cooldown }</div>
                            </div>
                        )) }
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-white/50">Level-Stufen</span>
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                    <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                        <div className="px-2.5 py-1.5 bg-white/[0.04] text-[10px] font-semibold text-white/40">Level</div>
                        <div className="px-2.5 py-1.5 bg-white/[0.04] text-[10px] font-semibold text-white/40">Titel</div>
                        <div className="px-2.5 py-1.5 bg-white/[0.04] text-[10px] font-semibold text-white/40">Punkte</div>
                        { LEVEL_TABLE.map((row, i) => (
                            <div key={ i } className="contents">
                                <div className="px-2.5 py-1.5 bg-[rgba(12,12,16,0.97)] text-[10px]" style={{ color: LEVEL_COLORS[row.level] }}>
                                    { row.stars }
                                </div>
                                <div className="px-2.5 py-1.5 bg-[rgba(12,12,16,0.97)] text-[10px] text-white/60">{ row.name }</div>
                                <div className="px-2.5 py-1.5 bg-[rgba(12,12,16,0.97)] text-[10px] text-white/40">{ row.points.toLocaleString() }</div>
                            </div>
                        )) }
                    </div>
                </div>
            </div>
        </div>
    );

    const STAT_ITEMS = [
        { key: 'chat_points', label: 'Chat', icon: MessageCircle, color: 'text-blue-400/70' },
        { key: 'whisper_points', label: 'Flüstern', icon: Eye, color: 'text-purple-400/70' },
        { key: 'trade_points', label: 'Handel', icon: Handshake, color: 'text-amber-400/70' },
        { key: 'action_points', label: 'Aktionen', icon: Swords, color: 'text-red-400/70' },
        { key: 'pm_points', label: 'Nachrichten', icon: Mail, color: 'text-emerald-400/70' },
        { key: 'event_points', label: 'Events', icon: Trophy, color: 'text-yellow-400/70' },
    ];

    return (
        <DraggableWindow uniqueKey="relationship" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[480px] max-h-[75vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(75vh-4px)]">

                    {/* Header */}
                    <div className="drag-handler flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent shrink-0 cursor-move">
                        <div className="flex items-center gap-2.5">
                            { selectedRel ? (
                                <button className="p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all cursor-pointer" onClick={ () => setSelectedRel(null) }>
                                    <ArrowLeft className="size-4" />
                                </button>
                            ) : (
                                <Users className="size-4 text-pink-400/70" />
                            ) }
                            <span className="text-sm font-semibold text-white/90 tracking-tight">
                                { selectedRel ? selectedRel.other_username : 'Beziehungen' }
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            { !selectedRel && (
                                <button
                                    className={ `p-1.5 rounded-lg transition-all cursor-pointer ${ showInfo ? 'text-pink-400 bg-pink-500/10' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.08]' }` }
                                    onClick={ () => setShowInfo(prev => !prev) }
                                    title="Info zum Beziehungssystem"
                                >
                                    <Info className="size-3.5" />
                                </button>
                            ) }
                            <button className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all cursor-pointer" onClick={ onClose }>
                                <FaTimes className="size-3" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto px-4 pb-4 pt-3">
                        { loading && <div className="text-center py-12 text-white/30 text-xs">Laden...</div> }

                        {/* Detail View */}
                        { !loading && selectedRel && (
                            <div className="flex flex-col gap-4">
                                {/* Avatars + Level */}
                                <div className="flex items-center justify-center gap-6 py-3">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-16 h-20 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center overflow-hidden">
                                            <LayoutAvatarImageView figure={ GetSessionDataManager().figure } direction={ 2 } />
                                        </div>
                                        <span className="text-[11px] text-white/50">{ GetSessionDataManager().userName }</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="text-lg">{ renderStars(selectedRel.level) }</div>
                                        <span className="text-xs font-semibold" style={{ color: LEVEL_COLORS[selectedRel.level] }}>
                                            { selectedRel.level_name }
                                        </span>
                                        <span className="text-[10px] text-white/30">Level { selectedRel.level }</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-16 h-20 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center overflow-hidden">
                                            <LayoutAvatarImageView figure={ selectedRel.other_look } direction={ 4 } />
                                        </div>
                                        <span className="text-[11px] text-white/50">{ selectedRel.other_username }</span>
                                    </div>
                                </div>

                                {/* Friendship date */}
                                { selectedRel.friends_since && (
                                    <div className="text-center text-[11px] text-white/40">
                                        Freunde seit { new Date(selectedRel.friends_since * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) }
                                    </div>
                                ) }

                                {/* Progress */}
                                <div className="px-2">
                                    { renderProgress(selectedRel) }
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    { STAT_ITEMS.map(stat =>
                                    {
                                        const Icon = stat.icon;
                                        const val = (selectedRel as any)[stat.key] ?? 0;
                                        return (
                                            <div key={ stat.key } className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                <Icon className={ `size-4 ${ stat.color }` } />
                                                <span className="text-sm font-semibold text-white/80">{ val.toLocaleString() }</span>
                                                <span className="text-[10px] text-white/30">{ stat.label }</span>
                                            </div>
                                        );
                                    }) }
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <span className="text-xs text-white/50">Gesamt: </span>
                                    <span className="text-sm font-bold text-white/90 ml-1.5">{ selectedRel.points.toLocaleString() } Punkte</span>
                                </div>
                            </div>
                        ) }

                        {/* List View */}
                        { !loading && !selectedRel && (
                            <div className="flex flex-col gap-2">
                                { showInfo && renderInfoPanel() }

                                { relationships.length === 0 && !showInfo && (
                                    <div className="flex flex-col items-center gap-4 py-6">
                                        <div className="flex flex-col items-center text-white/20">
                                            <Heart className="size-10 mb-2" />
                                            <span className="text-xs">Noch keine Beziehungen</span>
                                        </div>
                                        { renderInfoPanel() }
                                    </div>
                                ) }

                                { relationships.map((rel, i) => (
                                    <button
                                        key={ rel.other_id }
                                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-left w-full"
                                        onClick={ () => selectDetail(rel) }
                                    >
                                        {/* Rank */}
                                        <span className="text-[11px] text-white/20 w-4 text-center shrink-0">{ i + 1 }</span>

                                        {/* Avatar */}
                                        <div className="w-14 h-14 shrink-0 relative">
                                            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'scale(2)', transformOrigin: 'center center' }}>
                                                <LayoutAvatarImageView figure={ rel.other_look } direction={ 2 } headOnly={ true } />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-white/80 truncate">{ rel.other_username }</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px]">{ renderStars(rel.level) }</span>
                                                <span className="text-[10px]" style={{ color: LEVEL_COLORS[rel.level] }}>{ rel.level_name }</span>
                                            </div>
                                            <div className="mt-1">{ renderProgress(rel) }</div>
                                        </div>

                                        {/* Points */}
                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-semibold text-white/60">{ rel.points.toLocaleString() }</span>
                                            <div className="text-[9px] text-white/25">Punkte</div>
                                        </div>
                                    </button>
                                )) }
                            </div>
                        ) }
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
};
