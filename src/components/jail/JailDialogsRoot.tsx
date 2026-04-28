import { FC } from 'react';
import { JailBailDialog } from './JailBailDialog';
import { JailCigaretteDialog } from './JailCigaretteDialog';
import { JailMinigamesDialog } from './JailMinigamesDialog';
import { JailRankDialog } from './JailRankDialog';
import { JailShopDialog } from './JailShopDialog';

/**
 * Mounted once at the root (MainView). Holds the five draggable jail dialogs
 * that share global open/close/zIndex state via useJailDialogManager.
 */
export const JailDialogsRoot: FC = () => {
    return (
        <>
            <JailShopDialog />
            <JailRankDialog />
            <JailCigaretteDialog />
            <JailBailDialog />
            <JailMinigamesDialog />
        </>
    );
};
