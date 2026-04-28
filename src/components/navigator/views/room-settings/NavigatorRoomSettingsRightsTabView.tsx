import { FlatControllerAddedEvent, FlatControllerRemovedEvent, FlatControllersEvent, RemoveAllRightsMessageComposer, RoomTakeRightsComposer, RoomUsersWithRightsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { UserProfileIconView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import { NavigatorPanel, NavigatorPanelStack, NavigatorScrollViewport, PixelIcon } from '../NavigatorPrimitives';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

export const NavigatorRoomSettingsRightsTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null } = props;
    const [ usersWithRights, setUsersWithRights ] = useState<Map<number, string>>(new Map());

    useMessageEvent<FlatControllersEvent>(FlatControllersEvent, event =>
    {
        const parser = event.getParser();
        if(!roomData || (roomData.roomId !== parser.roomId)) return;
        setUsersWithRights(parser.users);
    });

    useMessageEvent<FlatControllerAddedEvent>(FlatControllerAddedEvent, event =>
    {
        const parser = event.getParser();
        if(!roomData || (roomData.roomId !== parser.roomId)) return;
        setUsersWithRights(prevValue =>
        {
            const newValue = new Map(prevValue);
            newValue.set(parser.data.userId, parser.data.userName);
            return newValue;
        });
    });

    useMessageEvent<FlatControllerRemovedEvent>(FlatControllerRemovedEvent, event =>
    {
        const parser = event.getParser();
        if(!roomData || (roomData.roomId !== parser.roomId)) return;
        setUsersWithRights(prevValue =>
        {
            const newValue = new Map(prevValue);
            newValue.delete(parser.userId);
            return newValue;
        });
    });

    useEffect(() =>
    {
        SendMessageComposer(new RoomUsersWithRightsComposer(roomData.roomId));
    }, [ roomData.roomId ]);

    return (
        <NavigatorPanelStack>
            <NavigatorPanel>
                <div className="flex flex-col gap-2">
                    <span className="text-label-xs text-text-strong-950">
                        { LocalizeText('navigator.flatctrls.userswithrights', [ 'displayed', 'total' ], [ usersWithRights.size.toString(), usersWithRights.size.toString() ]) }
                    </span>
                    <NavigatorScrollViewport className="h-[120px]">
                        <div className="flex flex-col gap-0.5">
                            { usersWithRights.size === 0 && (
                                <span className="py-4 text-center text-paragraph-xs text-text-sub-600">Keine User mit Rechten</span>
                            ) }
                            { Array.from(usersWithRights.entries()).map(([ id, name ], index) => (
                                <div
                                    key={ index }
                                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-bg-weak-50"
                                >
                                    <UserProfileIconView userName={ name } />
                                    <span className="flex-1 truncate text-paragraph-xs text-text-strong-950">{ name }</span>
                                    <button
                                        className="rounded p-0.5 opacity-0 transition-opacity hover:bg-error-lighter group-hover:opacity-100"
                                        onClick={ () => SendMessageComposer(new RoomTakeRightsComposer(id)) }
                                    >
                                        <PixelIcon src="/navigator/icons/sign-red.png" size="size-3" alt="Entfernen" />
                                    </button>
                                </div>
                            )) }
                        </div>
                    </NavigatorScrollViewport>
                    <AlignButton.Root
                        type="button"
                        variant="error"
                        mode="stroke"
                        size="xsmall"
                        disabled={ !usersWithRights.size }
                        onClick={ () => SendMessageComposer(new RemoveAllRightsMessageComposer(roomData.roomId)) }
                    >
                        { LocalizeText('navigator.flatctrls.clear') }
                    </AlignButton.Root>
                </div>
            </NavigatorPanel>
        </NavigatorPanelStack>
    );
}
