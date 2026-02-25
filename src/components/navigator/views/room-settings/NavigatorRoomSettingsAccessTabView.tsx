import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Frame, FramePanel } from '@/components/ui/frame';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

export const NavigatorRoomSettingsAccessTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null } = props;
    const [ password, setPassword ] = useState<string>('');
    const [ confirmPassword, setConfirmPassword ] = useState('');
    const [ isTryingPassword, setIsTryingPassword ] = useState(false);

    const saveRoomPassword = () =>
    {
        if(!isTryingPassword || ((password.length <= 0) || (confirmPassword.length <= 0) || (password !== confirmPassword))) return;
        handleChange('password', password);
    }

    useEffect(() =>
    {
        setPassword('');
        setConfirmPassword('');
        setIsTryingPassword(false);
    }, [ roomData ]);

    return (
        <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">{ LocalizeText('navigator.roomsettings.roomaccess.caption') }</span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed">{ LocalizeText('navigator.roomsettings.roomaccess.info') }</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium">{ LocalizeText('navigator.roomsettings.doormode') }</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="lockState" className="accent-primary w-3.5 h-3.5" checked={ (roomData.lockState === RoomDataParser.OPEN_STATE) && !isTryingPassword } onChange={ () => handleChange('lock_state', RoomDataParser.OPEN_STATE) } />
                            <span className="text-xs">{ LocalizeText('navigator.roomsettings.doormode.open') }</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="lockState" className="accent-primary w-3.5 h-3.5" checked={ (roomData.lockState === RoomDataParser.DOORBELL_STATE) && !isTryingPassword } onChange={ () => handleChange('lock_state', RoomDataParser.DOORBELL_STATE) } />
                            <span className="text-xs">{ LocalizeText('navigator.roomsettings.doormode.doorbell') }</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="lockState" className="accent-primary w-3.5 h-3.5" checked={ (roomData.lockState === RoomDataParser.INVISIBLE_STATE) && !isTryingPassword } onChange={ () => handleChange('lock_state', RoomDataParser.INVISIBLE_STATE) } />
                            <span className="text-xs">{ LocalizeText('navigator.roomsettings.doormode.invisible') }</span>
                        </label>
                        <div className="flex items-start gap-2">
                            <input type="radio" name="lockState" className="accent-primary w-3.5 h-3.5 mt-0.5" checked={ (roomData.lockState === RoomDataParser.PASSWORD_STATE) || isTryingPassword } onChange={ event => setIsTryingPassword(event.target.checked) } />
                            <div className="flex flex-col gap-1.5 flex-1">
                                <span className="text-xs">{ LocalizeText('navigator.roomsettings.doormode.password') }</span>
                                { (isTryingPassword || (roomData.lockState === RoomDataParser.PASSWORD_STATE)) && (
                                    <>
                                        <Input type="password" className="h-7 text-xs" value={ password } onChange={ event => setPassword(event.target.value) } placeholder={ LocalizeText('navigator.roomsettings.password') } onFocus={ () => setIsTryingPassword(true) } />
                                        { isTryingPassword && (password.length <= 0) &&
                                            <span className="text-[10px] text-destructive font-medium">{ LocalizeText('navigator.roomsettings.passwordismandatory') }</span> }
                                        <Input type="password" className="h-7 text-xs" value={ confirmPassword } onChange={ event => setConfirmPassword(event.target.value) } onBlur={ saveRoomPassword } placeholder={ LocalizeText('navigator.roomsettings.passwordconfirm') } />
                                        { isTryingPassword && ((password.length > 0) && (password !== confirmPassword)) &&
                                            <span className="text-[10px] text-destructive font-medium">{ LocalizeText('navigator.roomsettings.invalidconfirm') }</span> }
                                    </>
                                ) }
                            </div>
                        </div>
                    </div>
                </div>
            </FramePanel>
            <FramePanel>
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium">{ LocalizeText('navigator.roomsettings.pets') }</span>
                    <div className="flex items-center gap-2">
                        <Checkbox id="pets" checked={ roomData.allowPets } onCheckedChange={ val => handleChange('allow_pets', !!val) } />
                        <label htmlFor="pets" className="text-xs cursor-pointer">{ LocalizeText('navigator.roomsettings.allowpets') }</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="petsEat" checked={ roomData.allowPetsEat } onCheckedChange={ val => handleChange('allow_pets_eat', !!val) } />
                        <label htmlFor="petsEat" className="text-xs cursor-pointer">{ LocalizeText('navigator.roomsettings.allowfoodconsume') }</label>
                    </div>
                </div>
            </FramePanel>
        </Frame>
    );
};
