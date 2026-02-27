import { FC, useEffect, useState } from 'react';
import { LocalizeBadgeName, UnseenItemCategory } from '../../../../api';
import { LayoutBadgeImageView } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryBadgeItemView } from './InventoryBadgeItemView';

export const InventoryBadgeView: FC<{}> = () =>
{
    const [isVisible, setIsVisible] = useState(false);
    const { badgeCodes, activeBadgeCodes, selectedBadgeCode, isWearingBadge, canWearBadges, toggleBadge, getBadgeId, activate, deactivate } = useInventoryBadges();
    const { isUnseen, removeUnseen } = useInventoryUnseenTracker();

    useEffect(() => {
        if (!selectedBadgeCode || !isUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode))) return;
        removeUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode));
    }, [selectedBadgeCode, isUnseen, removeUnseen, getBadgeId]);

    useEffect(() => {
        if (!isVisible) return;
        const id = activate();
        return () => deactivate(id);
    }, [isVisible, activate, deactivate]);

    useEffect(() => {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    const wearing = isWearingBadge ? isWearingBadge : () => false;
    const inactiveBadges = badgeCodes ? badgeCodes.filter(code => !wearing(code)) : [];

    return (
        <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
            {/* Active Badges Section */}
            {activeBadgeCodes && activeBadgeCodes.length > 0 && (
                <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Aktive Abzeichen
                    </span>
                    <div className="flex flex-wrap gap-1">
                        {activeBadgeCodes.map((code, i) => (
                            <InventoryBadgeItemView key={i} badgeCode={code} />
                        ))}
                    </div>
                </div>
            )}

            {/* Divider */}
            {activeBadgeCodes && activeBadgeCodes.length > 0 && inactiveBadges.length > 0 && (
                <div className="mx-3 border-b border-border my-1" />
            )}

            {/* All Badges Grid */}
            <div className="flex-1 overflow-y-auto px-3 py-1.5" style={{ minHeight: 0 }}>
                {inactiveBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {inactiveBadges.map((code, i) => (
                            <InventoryBadgeItemView key={i} badgeCode={code} />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40 select-none py-12">
                        <span className="text-3xl">🏅</span>
                        <span className="text-sm font-medium">Keine Abzeichen vorhanden</span>
                    </div>
                )}
            </div>

            {/* Selected Badge Footer */}
            {selectedBadgeCode && (
                <div className="flex items-center gap-3 px-3 py-2 border-t border-border">
                    <div className="w-10 h-10 shrink-0 rounded-md bg-accent flex items-center justify-center">
                        <LayoutBadgeImageView badgeCode={selectedBadgeCode} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground leading-tight truncate">
                            {LocalizeBadgeName(selectedBadgeCode)}
                        </div>
                    </div>
                    <button
                        className={
                            'shrink-0 px-3 py-1.5 rounded-md text-white text-xs font-medium transition-colors cursor-pointer ' +
                            (wearing(selectedBadgeCode)
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-emerald-600 hover:bg-emerald-500')
                        }
                        disabled={!wearing(selectedBadgeCode) && canWearBadges && !canWearBadges()}
                        onClick={() => toggleBadge(selectedBadgeCode)}
                    >
                        {wearing(selectedBadgeCode) ? 'Ablegen' : 'Anlegen'}
                    </button>
                </div>
            )}
        </div>
    );
};
