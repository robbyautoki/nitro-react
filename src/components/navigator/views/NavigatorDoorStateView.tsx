import { FC, useEffect, useState } from 'react';
import { FaBell, FaKey } from 'react-icons/fa';
import { X } from 'lucide-react';
import { CreateRoomSession, DoorStateType, GoToDesktop, LocalizeText } from '../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../common';
import { useNavigator } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { NavigatorTextInput } from './NavigatorPrimitives';

const VISIBLE_STATES = [ DoorStateType.START_DOORBELL, DoorStateType.STATE_WAITING, DoorStateType.STATE_NO_ANSWER, DoorStateType.START_PASSWORD, DoorStateType.STATE_WRONG_PASSWORD ];
const DOORBELL_STATES = [ DoorStateType.START_DOORBELL, DoorStateType.STATE_WAITING, DoorStateType.STATE_NO_ANSWER ];
const PASSWORD_STATES = [ DoorStateType.START_PASSWORD, DoorStateType.STATE_WRONG_PASSWORD ];

export const NavigatorDoorStateView: FC<{}> = props =>
{
    const [ password, setPassword ] = useState('');
    const { doorData = null, setDoorData = null } = useNavigator();

    const onClose = () =>
    {
        if(doorData && (doorData.state === DoorStateType.STATE_WAITING)) GoToDesktop();

        setDoorData(null);
    }

    const ring = () =>
    {
        if(!doorData || !doorData.roomInfo) return;

        CreateRoomSession(doorData.roomInfo.roomId);

        setDoorData(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.state = DoorStateType.STATE_PENDING_SERVER;

            return newValue;
        });
    }

    const tryEntering = () =>
    {
        if(!doorData || !doorData.roomInfo) return;

        CreateRoomSession(doorData.roomInfo.roomId, password);

        setDoorData(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.state = DoorStateType.STATE_PENDING_SERVER;

            return newValue;
        });
    }

    useEffect(() =>
    {
        if(!doorData || (doorData.state !== DoorStateType.STATE_NO_ANSWER)) return;

        GoToDesktop();
    }, [ doorData ]);

    if(!doorData || (doorData.state === DoorStateType.NONE) || (VISIBLE_STATES.indexOf(doorData.state) === -1)) return null;

    const isDoorbell = (DOORBELL_STATES.indexOf(doorData.state) >= 0);

    return (
        <DraggableWindow uniqueKey="nitro-navigator-door" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <AlignSurface.Panel className="nitro-navigator-doorbell flex w-[260px] flex-col overflow-hidden">
                <div className="drag-handler flex h-9 shrink-0 cursor-grab items-center justify-between border-b border-stroke-soft-200 px-3 active:cursor-grabbing">
                    <span className="truncate text-label-xs text-text-strong-950">
                        { LocalizeText(isDoorbell ? 'navigator.doorbell.title' : 'navigator.password.title') }
                    </span>
                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onMouseDown={ event => event.stopPropagation() } onClick={ onClose }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>
                <div className="flex flex-col gap-3 p-3">
                    <div className="flex items-center gap-2">
                        { isDoorbell
                            ? <FaBell className="size-4 shrink-0 text-warning-base" />
                            : <FaKey className="size-4 shrink-0 text-information-base" /> }
                        <span className="truncate text-label-sm text-text-strong-950">
                            { doorData && doorData.roomInfo && doorData.roomInfo.roomName }
                        </span>
                    </div>
                    <p className="text-paragraph-xs leading-relaxed text-text-sub-600">
                        { (doorData.state === DoorStateType.START_DOORBELL) && LocalizeText('navigator.doorbell.info') }
                        { (doorData.state === DoorStateType.STATE_WAITING) && (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="inline-block size-1.5 animate-pulse rounded-full bg-warning-base" />
                                { LocalizeText('navigator.doorbell.waiting') }
                            </span>
                        ) }
                        { (doorData.state === DoorStateType.STATE_NO_ANSWER) && LocalizeText('navigator.doorbell.no.answer') }
                        { (doorData.state === DoorStateType.START_PASSWORD) && LocalizeText('navigator.password.info') }
                        { (doorData.state === DoorStateType.STATE_WRONG_PASSWORD) && (
                            <span className="text-error-base">{ LocalizeText('navigator.password.retryinfo') }</span>
                        ) }
                    </p>
                    { isDoorbell && (
                        <div className="flex flex-col gap-1.5">
                            { (doorData.state === DoorStateType.START_DOORBELL) &&
                                <AlignButton.Root type="button" variant="primary" mode="filled" size="xsmall" className="w-full" onClick={ ring }>
                                    { LocalizeText('navigator.doorbell.button.ring') }
                                </AlignButton.Root> }
                            <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xsmall" className="w-full" onClick={ onClose }>
                                { LocalizeText('generic.cancel') }
                            </AlignButton.Root>
                        </div>
                    ) }
                    { !isDoorbell && (
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-paragraph-xs text-text-sub-600">{ LocalizeText('navigator.password.enter') }</label>
                                <NavigatorTextInput
                                    type="password"
                                    onChange={ event => setPassword(event.target.value) }
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <AlignButton.Root type="button" variant="primary" mode="filled" size="xsmall" className="w-full" onClick={ tryEntering }>
                                    { LocalizeText('navigator.password.button.try') }
                                </AlignButton.Root>
                                <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xsmall" className="w-full" onClick={ onClose }>
                                    { LocalizeText('generic.cancel') }
                                </AlignButton.Root>
                            </div>
                        </div>
                    ) }
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
