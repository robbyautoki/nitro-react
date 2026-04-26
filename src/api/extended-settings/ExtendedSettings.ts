export type WhisperPolicy = 'all' | 'friends' | 'none';
export type FontSize = 'small' | 'normal' | 'large';
export type RenderQuality = 'eco' | 'balanced' | 'ultra';
export type WalkSpeed = 'walk' | 'run';
export type HotelviewVariant = 'default' | 'christmas' | 'summer' | 'custom';
export type CursorStyle = 'classic' | 'modern' | 'pixel';

export interface ExtendedSettings
{
    whisperPolicy: WhisperPolicy;
    bubbleShape: number;
    fontSize: FontSize;
    hideRepeatMsgs: boolean;
    hotelviewVariant: HotelviewVariant;
    renderQuality: RenderQuality;
    cursorStyle: CursorStyle;
    walkSpeed: WalkSpeed;
    showTileHover: boolean;
    showPetBubbles: boolean;
    silentMode: boolean;
    tradeConfirm: boolean;
    autoAfkMinutes: number;
    loginAlertMail: boolean;
    notifyMail: number;
    notifyDiscord: number;
    notifyIngame: number;
}

export const DEFAULT_EXTENDED_SETTINGS: ExtendedSettings = {
    whisperPolicy: 'all',
    bubbleShape: 0,
    fontSize: 'normal',
    hideRepeatMsgs: false,
    hotelviewVariant: 'default',
    renderQuality: 'balanced',
    cursorStyle: 'classic',
    walkSpeed: 'walk',
    showTileHover: true,
    showPetBubbles: true,
    silentMode: false,
    tradeConfirm: true,
    autoAfkMinutes: 5,
    loginAlertMail: true,
    notifyMail: 31,
    notifyDiscord: 0,
    notifyIngame: 65535,
};

export const EXTENDED_SETTINGS_EVENT = 'bahhos:extended-settings-changed';
