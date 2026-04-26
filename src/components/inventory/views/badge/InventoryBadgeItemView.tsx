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
                    ? 'bg-primary-alpha-10 ring-1 ring-primary-base'
                    : 'bg-transparent hover:bg-bg-weak-50')
            }
            onClick={ () => setSelectedBadgeCode(badgeCode) }
            onDoubleClick={ () => toggleBadge(badgeCode) }
        >
            <LayoutBadgeImageView badgeCode={ badgeCode } />
            { unseen && (
                <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-success-base ring-2 ring-bg-white-0" />
            ) }
        </div>
    );
};
