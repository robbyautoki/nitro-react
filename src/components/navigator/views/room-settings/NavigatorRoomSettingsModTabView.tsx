import { BannedUserData, BannedUsersFromRoomEvent, RoomBannedUsersComposer, RoomModerationSettings, RoomUnbanUserComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { UserProfileIconView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Frame, FramePanel } from '@/components/ui/frame';
import { cn } from '@/lib/utils';

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
        <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
                <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-2">
                        <span className="text-xs font-medium">
                            { LocalizeText('navigator.roomsettings.moderation.banned.users') } ({ bannedUsers.length })
                        </span>
                        <ScrollArea className="h-[100px]">
                            <div className="flex flex-col gap-0.5">
                                { bannedUsers.length === 0 && (
                                    <span className="text-[11px] text-muted-foreground text-center py-4">Keine gebannten User</span>
                                ) }
                                { bannedUsers.map((user, index) => (
                                    <div
                                        key={ index }
                                        className={ cn(
                                            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                                            selectedUserId === user.userId ? 'bg-muted ring-1 ring-border' : 'hover:bg-muted/50'
                                        ) }
                                        onClick={ () => setSelectedUserId(user.userId) }
                                    >
                                        <UserProfileIconView userName={ user.userName } />
                                        <span className="text-xs truncate flex-1">{ user.userName }</span>
                                    </div>
                                )) }
                            </div>
                        </ScrollArea>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={ (selectedUserId <= 0) }
                            onClick={ () => unBanUser(selectedUserId) }
                        >
                            { LocalizeText('navigator.roomsettings.moderation.unban') } { selectedUserId > 0 && bannedUsers.find(user => (user.userId === selectedUserId))?.userName }
                        </Button>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium">{ LocalizeText('navigator.roomsettings.moderation.mute.header') }</span>
                            <Select value={ String(roomData.moderationSettings.allowMute) } onValueChange={ val => handleChange('moderation_mute', val) }>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_NONE) } className="text-xs">{ LocalizeText('navigator.roomsettings.moderation.none') }</SelectItem>
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_USER_WITH_RIGHTS) } className="text-xs">{ LocalizeText('navigator.roomsettings.moderation.rights') }</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium">{ LocalizeText('navigator.roomsettings.moderation.kick.header') }</span>
                            <Select value={ String(roomData.moderationSettings.allowKick) } onValueChange={ val => handleChange('moderation_kick', val) }>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_NONE) } className="text-xs">{ LocalizeText('navigator.roomsettings.moderation.none') }</SelectItem>
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_USER_WITH_RIGHTS) } className="text-xs">{ LocalizeText('navigator.roomsettings.moderation.rights') }</SelectItem>
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_ALL) } className="text-xs">{ LocalizeText('navigator.roomsettings.moderation.all') }</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium">{ LocalizeText('navigator.roomsettings.moderation.ban.header') }</span>
                            <Select value={ String(roomData.moderationSettings.allowBan) } onValueChange={ val => handleChange('moderation_ban', val) }>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_NONE) } className="text-xs">{ LocalizeText('navigator.roomsettings.moderation.none') }</SelectItem>
                                    <SelectItem value={ String(RoomModerationSettings.MODERATION_LEVEL_USER_WITH_RIGHTS) } className="text-xs">{ LocalizeText('navigator.roomsettings.moderation.rights') }</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </FramePanel>
        </Frame>
    );
}
