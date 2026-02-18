import { FC, useEffect, useState } from 'react';
import { FaBell, FaKey } from 'react-icons/fa';
import { CreateRoomSession, DoorStateType, GoToDesktop, LocalizeText } from '../../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../../common';
import { useNavigator } from '../../../hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        <NitroCardView className="nitro-navigator-doorbell" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText(isDoorbell ? 'navigator.doorbell.title' : 'navigator.password.title') } onCloseClick={ onClose } />
            <NitroCardContentView>
                <div className="flex flex-col gap-3 p-1">
                    <div className="flex items-center gap-2">
                        { isDoorbell
                            ? <FaBell className="size-4 text-amber-400 shrink-0" />
                            : <FaKey className="size-4 text-sky-400 shrink-0" /> }
                        <span className="text-sm font-medium text-white truncate">
                            { doorData && doorData.roomInfo && doorData.roomInfo.roomName }
                        </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                        { (doorData.state === DoorStateType.START_DOORBELL) && LocalizeText('navigator.doorbell.info') }
                        { (doorData.state === DoorStateType.STATE_WAITING) && (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                { LocalizeText('navigator.doorbell.waiting') }
                            </span>
                        ) }
                        { (doorData.state === DoorStateType.STATE_NO_ANSWER) && LocalizeText('navigator.doorbell.no.answer') }
                        { (doorData.state === DoorStateType.START_PASSWORD) && LocalizeText('navigator.password.info') }
                        { (doorData.state === DoorStateType.STATE_WRONG_PASSWORD) && (
                            <span className="text-red-400">{ LocalizeText('navigator.password.retryinfo') }</span>
                        ) }
                    </p>

                    { isDoorbell && (
                        <div className="flex flex-col gap-1.5">
                            { (doorData.state === DoorStateType.START_DOORBELL) &&
                                <Button className="w-full h-8 text-xs bg-sky-500 hover:bg-sky-400 text-white" onClick={ ring }>
                                    { LocalizeText('navigator.doorbell.button.ring') }
                                </Button> }
                            <Button variant="ghost" className="w-full h-8 text-xs text-zinc-400 hover:text-white hover:bg-white/10" onClick={ onClose }>
                                { LocalizeText('generic.cancel') }
                            </Button>
                        </div>
                    ) }

                    { !isDoorbell && (
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-zinc-400">{ LocalizeText('navigator.password.enter') }</label>
                                <Input
                                    type="password"
                                    className="h-8 text-xs rounded-lg bg-white/10 border-0 text-white placeholder:text-zinc-500 focus-visible:bg-white/15"
                                    onChange={ event => setPassword(event.target.value) }
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Button className="w-full h-8 text-xs bg-sky-500 hover:bg-sky-400 text-white" onClick={ tryEntering }>
                                    { LocalizeText('navigator.password.button.try') }
                                </Button>
                                <Button variant="ghost" className="w-full h-8 text-xs text-zinc-400 hover:text-white hover:bg-white/10" onClick={ onClose }>
                                    { LocalizeText('generic.cancel') }
                                </Button>
                            </div>
                        </div>
                    ) }
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
}
