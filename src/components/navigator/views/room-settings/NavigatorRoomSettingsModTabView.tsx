import { BannedUserData, BannedUsersFromRoomEvent, RoomBannedUsersComposer, RoomModerationSettings, RoomUnbanUserComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { UserProfileIconView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSelect from '@/align-ui/components/ui/select';
import { cn } from '@/align-ui/utils/cn';
import { NavigatorPanel, NavigatorPanelStack, NavigatorScrollViewport } from '../NavigatorPrimitives';

const Select = AlignSelect.Root;
const SelectTrigger = AlignSelect.Trigger;
const SelectValue = AlignSelect.Value;
const SelectContent = AlignSelect.Content;
const SelectItem = AlignSelect.Item;

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

export const NavigatorRoomSettingsModTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null } = props;
    const [ selectedUserId, setSelectedUserId ] = useState<number>(-1);
    const [ bannedUsers, setBannedUsers ] = useState<BannedUserData[]>([]);

    const unBanUser = (userId: number) =>
    {
        setBannedUsers(prevValue =>
        {
            const newValue = [ ...prevValue ];
            const index = newValue.findIndex(value => (value.userId === userId));
            if(index >= 0) newValue.splice(index, 1);
            return newValue;
        })

        SendMessageComposer(new RoomUnbanUserComposer(userId, roomData.roomId));
        setSelectedUserId(-1);
    }

    useMessageEvent<BannedUsersFromRoomEvent>(BannedUsersFromRoomEvent, event =>
    {
        const parser = event.getParser();
        if(!roomData || (roomData.roomId !== parser.roomId)) return;
        setBannedUsers(parser.bannedUsers);
    });

    useEffect(() =>
    {
        SendMessageComposer(new RoomBannedUsersComposer(roomData.roomId));
    }, [ roomData.roomId ]);

    return (
        <NavigatorPanelStack>
            <NavigatorPanel>
                <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-2">
                        <span className="text-label-xs text-text-strong-950">
                            { LocalizeText('navigator.roomsettings.moderation.banned.users') } ({ bannedUsers.length })
                        </span>
                        <NavigatorScrollViewport className="h-[100px]">
                            <div className="flex flex-col gap-0.5">
                                { bannedUsers.length === 0 && (
                                    <span className="py-4 text-center text-paragraph-xs text-text-sub-600">Keine gebannten User</span>
                                ) }
                                { bannedUsers.map((user, index) => (
                                    <div
                                        key={ index }
                                        className={ cn(
                                            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                                            selectedUserId === user.userId ? 'bg-primary-alpha-10 ring-1 ring-primary-base' : 'hover:bg-bg-weak-50'
                                        ) }
                                        onClick={ () => setSelectedUserId(user.userId) }
                                    >
                                        <UserProfileIconView userName={ user.userName } />
                                        <span className="flex-1 truncate text-paragraph-xs text-text-strong-950">{ user.userName }</span>
                                    </div>
                                )) }
                            </div>
                        </NavigatorScrollViewport>
                        <AlignButton.Root
                            type="button"
                            variant="neutral"
                            mode="stroke"
                            size="xsmall"
                            disabled={ (selectedUserId <= 0) }
                            onClick={ () => unBanUser(selectedUserId) }
                        >
                            { LocalizeText('navigator.roomsettings.moderation.unban') } { selectedUserId > 0 && bannedUsers.find(user => (user.userId === selectedUserId))?.userName }
                        </AlignButton.Root>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.moderation.mute.header') }</span>
                            <Select size="xsmall" value={ String(roomData.moderationSettings.allowMute) } onValueChange={ val => handleChange('moderation_mute', val) }>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_NONE) }>{ LocalizeText('navigator.roomsettings.moderation.none') }</SelectItem>
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_USER_WITH_RIGHTS) }>{ LocalizeText('navigator.roomsettings.moderation.rights') }</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.moderation.kick.header') }</span>
                            <Select size="xsmall" value={ String(roomData.moderationSettings.allowKick) } onValueChange={ val => handleChange('moderation_kick', val) }>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_NONE) }>{ LocalizeText('navigator.roomsettings.moderation.none') }</SelectItem>
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_USER_WITH_RIGHTS) }>{ LocalizeText('navigator.roomsettings.moderation.rights') }</SelectItem>
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_ALL) }>{ LocalizeText('navigator.roomsettings.moderation.all') }</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.moderation.ban.header') }</span>
                            <Select size="xsmall" value={ String(roomData.moderationSettings.allowBan) } onValueChange={ val => handleChange('moderation_ban', val) }>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_NONE) }>{ LocalizeText('navigator.roomsettings.moderation.none') }</SelectItem>
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_USER_WITH_RIGHTS) }>{ LocalizeText('navigator.roomsettings.moderation.rights') }</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </NavigatorPanel>
        </NavigatorPanelStack>
    );
}
