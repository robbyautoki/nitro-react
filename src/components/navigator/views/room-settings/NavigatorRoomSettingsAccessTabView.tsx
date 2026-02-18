import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import { Input } from '@/components/ui/input';

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
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-200">{ LocalizeText('navigator.roomsettings.roomaccess.caption') }</span>
                <span className="text-[11px] text-zinc-500 leading-relaxed">{ LocalizeText('navigator.roomsettings.roomaccess.info') }</span>
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-200">{ LocalizeText('navigator.roomsettings.doormode') }</span>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="lockState" className="accent-sky-400 w-3.5 h-3.5" checked={ (roomData.lockState === RoomDataParser.OPEN_STATE) && !isTryingPassword } onChange={ () => handleChange('lock_state', RoomDataParser.OPEN_STATE) } />
                    <span className="text-xs text-zinc-300">{ LocalizeText('navigator.roomsettings.doormode.open') }</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="lockState" className="accent-sky-400 w-3.5 h-3.5" checked={ (roomData.lockState === RoomDataParser.DOORBELL_STATE) && !isTryingPassword } onChange={ () => handleChange('lock_state', RoomDataParser.DOORBELL_STATE) } />
                    <span className="text-xs text-zinc-300">{ LocalizeText('navigator.roomsettings.doormode.doorbell') }</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="lockState" className="accent-sky-400 w-3.5 h-3.5" checked={ (roomData.lockState === RoomDataParser.INVISIBLE_STATE) && !isTryingPassword } onChange={ () => handleChange('lock_state', RoomDataParser.INVISIBLE_STATE) } />
                    <span className="text-xs text-zinc-300">{ LocalizeText('navigator.roomsettings.doormode.invisible') }</span>
                </label>
                <div className="flex items-start gap-2">
                    <input type="radio" name="lockState" className="accent-sky-400 w-3.5 h-3.5 mt-0.5" checked={ (roomData.lockState === RoomDataParser.PASSWORD_STATE) || isTryingPassword } onChange={ event => setIsTryingPassword(event.target.checked) } />
                    <div className="flex flex-col gap-1.5 flex-1">
                        <span className="text-xs text-zinc-300">{ LocalizeText('navigator.roomsettings.doormode.password') }</span>
                        { (isTryingPassword || (roomData.lockState === RoomDataParser.PASSWORD_STATE)) && (
                            <>
                                <Input type="password" className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white placeholder:text-zinc-500 focus-visible:bg-white/15" value={ password } onChange={ event => setPassword(event.target.value) } placeholder={ LocalizeText('navigator.roomsettings.password') } onFocus={ () => setIsTryingPassword(true) } />
                                { isTryingPassword && (password.length <= 0) &&
                                    <span className="text-[10px] text-red-400 font-medium">{ LocalizeText('navigator.roomsettings.passwordismandatory') }</span> }
                                <Input type="password" className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white placeholder:text-zinc-500 focus-visible:bg-white/15" value={ confirmPassword } onChange={ event => setConfirmPassword(event.target.value) } onBlur={ saveRoomPassword } placeholder={ LocalizeText('navigator.roomsettings.passwordconfirm') } />
                                { isTryingPassword && ((password.length > 0) && (password !== confirmPassword)) &&
                                    <span className="text-[10px] text-red-400 font-medium">{ LocalizeText('navigator.roomsettings.invalidconfirm') }</span> }
                            </>
                        ) }
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-200">{ LocalizeText('navigator.roomsettings.pets') }</span>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-sky-400 w-3.5 h-3.5" checked={ roomData.allowPets } onChange={ event => handleChange('allow_pets', event.target.checked) } />
                    <span className="text-xs text-zinc-300">{ LocalizeText('navigator.roomsettings.allowpets') }</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-sky-400 w-3.5 h-3.5" checked={ roomData.allowPetsEat } onChange={ event => handleChange('allow_pets_eat', event.target.checked) } />
                    <span className="text-xs text-zinc-300">{ LocalizeText('navigator.roomsettings.allowfoodconsume') }</span>
                </label>
            </div>
        </div>
    );
};
