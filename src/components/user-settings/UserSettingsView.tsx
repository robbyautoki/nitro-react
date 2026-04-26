import { ILinkEventTracker, NitroSettingsEvent, UserSettingsCameraFollowComposer, UserSettingsEvent, UserSettingsOldChatComposer, UserSettingsRoomInvitesComposer, UserSettingsSoundComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { AddEventLinkTracker, DispatchMainEvent, DispatchUiEvent, LocalizeText, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { DraggableWindow } from '../../common';
import { useCatalogPlaceMultipleItems, useCatalogSkipPurchaseConfirmation, useMessageEvent } from '../../hooks';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignSlider from '@/align-ui/components/ui/slider';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as AlignSwitch from '@/align-ui/components/ui/switch';

export const UserSettingsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ userSettings, setUserSettings ] = useState<NitroSettingsEvent>(null);
    const [ catalogPlaceMultipleObjects, setCatalogPlaceMultipleObjects ] = useCatalogPlaceMultipleItems();
    const [ catalogSkipPurchaseConfirmation, setCatalogSkipPurchaseConfirmation ] = useCatalogSkipPurchaseConfirmation();

    const processAction = (type: string, value?: boolean | number | string) =>
    {
        let doUpdate = true;

        const clone = userSettings.clone();

        switch(type)
        {
            case 'close_view':
                setIsVisible(false);
                doUpdate = false;
                return;
            case 'oldchat':
                clone.oldChat = value as boolean;
                SendMessageComposer(new UserSettingsOldChatComposer(clone.oldChat));
                break;
            case 'room_invites':
                clone.roomInvites = value as boolean;
                SendMessageComposer(new UserSettingsRoomInvitesComposer(clone.roomInvites));
                break;
            case 'camera_follow':
                clone.cameraFollow = value as boolean;
                SendMessageComposer(new UserSettingsCameraFollowComposer(clone.cameraFollow));
                break;
            case 'system_volume':
                clone.volumeSystem = value as number;
                clone.volumeSystem = Math.max(0, clone.volumeSystem);
                clone.volumeSystem = Math.min(100, clone.volumeSystem);
                break;
            case 'furni_volume':
                clone.volumeFurni = value as number;
                clone.volumeFurni = Math.max(0, clone.volumeFurni);
                clone.volumeFurni = Math.min(100, clone.volumeFurni);
                break;
            case 'trax_volume':
                clone.volumeTrax = value as number;
                clone.volumeTrax = Math.max(0, clone.volumeTrax);
                clone.volumeTrax = Math.min(100, clone.volumeTrax);
                break;
        }

        if(doUpdate) setUserSettings(clone);
        
        DispatchMainEvent(clone)
    }

    const saveRangeSlider = (type: string) =>
    {
        switch(type)
        {
            case 'volume':
                SendMessageComposer(new UserSettingsSoundComposer(Math.round(userSettings.volumeSystem), Math.round(userSettings.volumeFurni), Math.round(userSettings.volumeTrax)));
                break;
        }
    }

    useMessageEvent<UserSettingsEvent>(UserSettingsEvent, event =>
    {
        const parser = event.getParser();
        const settingsEvent = new NitroSettingsEvent();

        settingsEvent.volumeSystem = parser.volumeSystem;
        settingsEvent.volumeFurni = parser.volumeFurni;
        settingsEvent.volumeTrax = parser.volumeTrax;
        settingsEvent.oldChat = parser.oldChat;
        settingsEvent.roomInvites = parser.roomInvites;
        settingsEvent.cameraFollow = parser.cameraFollow;
        settingsEvent.flags = parser.flags;
        settingsEvent.chatType = parser.chatType;

        setUserSettings(settingsEvent);
        DispatchMainEvent(settingsEvent);
    });

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
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'user-settings/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!userSettings) return;

        DispatchUiEvent(userSettings);
    }, [ userSettings ]);

    if(!isVisible || !userSettings) return null;

    const toggles = [
        { key: 'oldchat', label: LocalizeText('memenu.settings.chat.prefer.old.chat'), value: userSettings.oldChat, onChange: (value: boolean) => processAction('oldchat', value) },
        { key: 'room_invites', label: LocalizeText('memenu.settings.other.ignore.room.invites'), value: userSettings.roomInvites, onChange: (value: boolean) => processAction('room_invites', value) },
        { key: 'camera_follow', label: LocalizeText('memenu.settings.other.disable.room.camera.follow'), value: userSettings.cameraFollow, onChange: (value: boolean) => processAction('camera_follow', value) },
        { key: 'place_multiple', label: LocalizeText('memenu.settings.other.place.multiple.objects'), value: catalogPlaceMultipleObjects, onChange: setCatalogPlaceMultipleObjects },
        { key: 'skip_purchase', label: LocalizeText('memenu.settings.other.skip.purchase.confirmation'), value: catalogSkipPurchaseConfirmation, onChange: setCatalogSkipPurchaseConfirmation },
    ];

    const volumeRows = [
        { key: 'system_volume', label: LocalizeText('widget.memenu.settings.volume.ui'), value: userSettings.volumeSystem },
        { key: 'furni_volume', label: LocalizeText('widget.memenu.settings.volume.furni'), value: userSettings.volumeFurni },
        { key: 'trax_volume', label: LocalizeText('widget.memenu.settings.volume.trax'), value: userSettings.volumeTrax },
    ];

    return (
        <DraggableWindow uniqueKey="user-settings" handleSelector=".settings-drag-handler">
            <AlignSurface.Panel className="user-settings-window w-[360px] overflow-hidden">
                <AlignSurface.Header
                    className="settings-drag-handler cursor-grab select-none active:cursor-grabbing"
                    title={
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-full bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                                <Settings className="size-4" />
                            </span>
                            <span className="truncate">{ LocalizeText('widget.memenu.settings.title') }</span>
                        </div>
                    }
                    description="Client, Chat und Audio"
                    onClose={ () => processAction('close_view') }
                />
                <div className="space-y-5 p-4">
                    <section className="space-y-3">
                        <div className="text-label-xs uppercase text-text-soft-400">{ LocalizeText('navigator.roomsettings.tab.basic') }</div>
                        <div className="space-y-2">
                            { toggles.map(toggle => (
                                <div key={ toggle.key } className="flex items-center justify-between gap-3 rounded-xl bg-bg-weak-50 px-3 py-2">
                                    <span className="text-paragraph-sm text-text-strong-950">{ toggle.label }</span>
                                    <AlignSwitch.Root checked={ toggle.value } onCheckedChange={ toggle.onChange } />
                                </div>
                            )) }
                        </div>
                    </section>
                    <AlignDivider.Root />
                    <section className="space-y-3">
                        <div className="text-label-xs uppercase text-text-soft-400">{ LocalizeText('widget.memenu.settings.volume') }</div>
                        <div className="space-y-4">
                            { volumeRows.map(row => (
                                <div key={ row.key } className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-paragraph-sm text-text-strong-950">
                                            { row.value === 0 ? <VolumeX className="size-4 text-text-soft-400" /> : <Volume2 className="size-4 text-text-sub-600" /> }
                                            { row.label }
                                        </div>
                                        <span className="text-label-xs tabular-nums text-text-sub-600">{ Math.round(row.value) }%</span>
                                    </div>
                                    <AlignSlider.Root
                                        value={ [ row.value ] }
                                        max={ 100 }
                                        step={ 1 }
                                        onValueChange={ ([ value ]) => processAction(row.key, value) }
                                        onValueCommit={ () => saveRangeSlider('volume') }
                                    >
                                        <AlignSlider.Thumb />
                                    </AlignSlider.Root>
                                </div>
                            )) }
                        </div>
                    </section>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
