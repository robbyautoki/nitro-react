import { useEffect, useState } from 'react';
import { EquippedAssets, fetchEquippedAssets, SHOP_EQUIPPED_EVENT } from './shop-api';

const EMPTY_EQUIPPED: EquippedAssets = {
    nameplate: null,
    avatarDecoration: null,
    profileEffect: null
};

export function useEquippedAssets(userId: number, enabled = true) {
    const [equipped, setEquipped] = useState<EquippedAssets>(EMPTY_EQUIPPED);

    useEffect(() => {
        if(!enabled || !userId) {
            setEquipped(EMPTY_EQUIPPED);
            return;
        }

        let cancelled = false;

        fetchEquippedAssets(userId)
            .then(data => { if(!cancelled) setEquipped(data); })
            .catch(() => { if(!cancelled) setEquipped(EMPTY_EQUIPPED); });

        const onUpdated = (event: Event) => {
            const detail = (event as CustomEvent<{ userId?: number }>).detail;
            if(detail?.userId && detail.userId !== userId) return;
            fetchEquippedAssets(userId, true)
                .then(data => { if(!cancelled) setEquipped(data); })
                .catch(() => { if(!cancelled) setEquipped(EMPTY_EQUIPPED); });
        };

        window.addEventListener(SHOP_EQUIPPED_EVENT, onUpdated);

        return () => {
            cancelled = true;
            window.removeEventListener(SHOP_EQUIPPED_EVENT, onUpdated);
        };
    }, [enabled, userId]);

    return equipped;
}
