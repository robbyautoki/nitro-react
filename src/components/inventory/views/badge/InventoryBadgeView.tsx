import { FC, useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { LocalizeBadgeName, UnseenItemCategory } from '../../../../api';
import { LayoutBadgeImageView } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker } from '../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import { InventoryBadgeItemView } from './InventoryBadgeItemView';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';

export const InventoryBadgeView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { badgeCodes, activeBadgeCodes, selectedBadgeCode, isWearingBadge, canWearBadges, toggleBadge, getBadgeId, activate, deactivate } = useInventoryBadges();
    const { isUnseen, removeUnseen } = useInventoryUnseenTracker();

    useEffect(() =>
    {
        if (!selectedBadgeCode || !isUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode))) return;
        removeUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode));
    }, [ selectedBadgeCode, isUnseen, removeUnseen, getBadgeId ]);

    useEffect(() =>
    {
        if (!isVisible) return;
        const id = activate();
        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    const wearing = isWearingBadge ? isWearingBadge : () => false;
    const inactiveBadges = badgeCodes ? badgeCodes.filter(code => !wearing(code)) : [];
    const hasAnyBadges = (activeBadgeCodes && activeBadgeCodes.length > 0) || inactiveBadges.length > 0;

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-bg-white-0">
            { /* Toolbar */ }
            <div className="flex shrink-0 items-center justify-between border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-1.5">
                <span className="text-paragraph-xs font-medium text-text-sub-600">
                    { badgeCodes?.length || 0 } Abzeichen
                </span>
                { activeBadgeCodes && (
                    <AlignBadge.Root color="green" variant="lighter" size="small">
                        { activeBadgeCodes.length } aktiv
                    </AlignBadge.Root>
                ) }
            </div>
            { /* Active Badges Section */ }
            { activeBadgeCodes && activeBadgeCodes.length > 0 && (
                <div className="px-3 pb-2 pt-2">
                    <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-text-sub-600">
                        Aktive Abzeichen
                    </span>
                    <div className="flex flex-wrap gap-1">
                        { activeBadgeCodes.map((code, i) => (
                            <InventoryBadgeItemView key={ i } badgeCode={ code } />
                        )) }
                    </div>
                </div>
            ) }
            { /* Divider */ }
            { activeBadgeCodes && activeBadgeCodes.length > 0 && inactiveBadges.length > 0 && (
                <div className="px-3">
                    <AlignDivider.Root />
                </div>
            ) }
            { /* All Badges Grid */ }
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                { inactiveBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        { inactiveBadges.map((code, i) => (
                            <InventoryBadgeItemView key={ i } badgeCode={ code } />
                        )) }
                    </div>
                ) : !hasAnyBadges ? (
                    <InventoryCategoryEmptyView
                        title="Keine Abzeichen vorhanden"
                        desc="Sammle Abzeichen durch Aktivitäten"
                        icon={ Award }
                    />
                ) : null }
            </div>
            { /* Selected Badge Footer */ }
            { selectedBadgeCode && (
                <div className="flex shrink-0 items-center gap-3 border-t border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
                        <LayoutBadgeImageView badgeCode={ selectedBadgeCode } />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-label-sm font-semibold leading-tight text-text-strong-950">
                            { LocalizeBadgeName(selectedBadgeCode) }
                        </div>
                    </div>
                    <AlignButton.Root
                        type="button"
                        variant={ wearing(selectedBadgeCode) ? 'error' : 'primary' }
                        mode="filled"
                        size="xxsmall"
                        className="shrink-0"
                        disabled={ !wearing(selectedBadgeCode) && canWearBadges && !canWearBadges() }
                        onClick={ () => toggleBadge(selectedBadgeCode) }
                    >
                        { wearing(selectedBadgeCode) ? 'Ablegen' : 'Anlegen' }
                    </AlignButton.Root>
                </div>
            ) }
        </div>
    );
};
