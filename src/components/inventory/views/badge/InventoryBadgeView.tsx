import { FC, useEffect, useState } from 'react';
import { LocalizeBadgeName, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column, Flex, LayoutBadgeImageView, Text } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryBadgeItemView } from './InventoryBadgeItemView';

export const InventoryBadgeView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { badgeCodes = [], activeBadgeCodes = [], selectedBadgeCode = null, isWearingBadge = null, canWearBadges = null, toggleBadge = null, getBadgeId = null, activate = null, deactivate = null } = useInventoryBadges();
    const { isUnseen = null, removeUnseen = null } = useInventoryUnseenTracker();

    useEffect(() =>
    {
        if(!selectedBadgeCode || !isUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode))) return;

        removeUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode));
    }, [ selectedBadgeCode, isUnseen, removeUnseen, getBadgeId ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        const id = activate();

        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);

        return () => setIsVisible(false);
    }, []);

    return (
        <Column grow gap={ 0 } style={{ minHeight: 0 }}>
            { activeBadgeCodes && activeBadgeCodes.length > 0 &&
                <Column gap={ 1 } className="mb-2">
                    <Text small variant="muted">{ LocalizeText('inventory.badges.activebadges') }</Text>
                    <AutoGrid columnCount={ 7 }>
                        { activeBadgeCodes.map((badgeCode, index) => <InventoryBadgeItemView key={ index } badgeCode={ badgeCode } />) }
                    </AutoGrid>
                </Column> }
            <div className="inv-items-grid">
                <AutoGrid columnCount={ 7 }>
                    { badgeCodes && (badgeCodes.length > 0) && badgeCodes.map((badgeCode, index) =>
                    {
                        if(isWearingBadge(badgeCode)) return null;

                        return <InventoryBadgeItemView key={ index } badgeCode={ badgeCode } />
                    }) }
                </AutoGrid>
            </div>
            { !!selectedBadgeCode &&
                <div className="inv-footer">
                    <div className="inv-footer-preview">
                        <LayoutBadgeImageView shrink badgeCode={ selectedBadgeCode } />
                    </div>
                    <div className="inv-footer-info">
                        <div className="inv-footer-name">{ LocalizeBadgeName(selectedBadgeCode) }</div>
                        <div className="inv-footer-actions">
                            <Button variant={ (isWearingBadge(selectedBadgeCode) ? 'danger' : 'success') } size="sm" disabled={ !isWearingBadge(selectedBadgeCode) && !canWearBadges() } onClick={ event => toggleBadge(selectedBadgeCode) }>
                                { LocalizeText(isWearingBadge(selectedBadgeCode) ? 'inventory.badges.clearbadge' : 'inventory.badges.wearbadge') }
                            </Button>
                        </div>
                    </div>
                </div> }
        </Column>
    );
}
