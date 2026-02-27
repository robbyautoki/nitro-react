import { FC } from 'react';
import { UnseenItemCategory } from '../../../../api';
import { LayoutBadgeImageView } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker } from '../../../../hooks';

interface InventoryBadgeItemViewProps {
    badgeCode: string;
}

export const InventoryBadgeItemView: FC<InventoryBadgeItemViewProps> = ({ badgeCode }) =>
{
    const { selectedBadgeCode, setSelectedBadgeCode, toggleBadge, getBadgeId } = useInventoryBadges();
    const { isUnseen } = useInventoryUnseenTracker();

    const isActive = selectedBadgeCode === badgeCode;
    const unseen = isUnseen(UnseenItemCategory.BADGE, getBadgeId(badgeCode));

    return (
        <div
            className={
                'relative w-10 h-10 rounded-md flex items-center justify-center cursor-pointer transition-all ' +
                (isActive
                    ? 'bg-accent ring-1 ring-border'
                    : 'bg-transparent hover:bg-accent')
            }
            onClick={() => setSelectedBadgeCode(badgeCode)}
            onDoubleClick={() => toggleBadge(badgeCode)}
        >
            <LayoutBadgeImageView badgeCode={badgeCode} />
            {unseen && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
            )}
        </div>
    );
};
