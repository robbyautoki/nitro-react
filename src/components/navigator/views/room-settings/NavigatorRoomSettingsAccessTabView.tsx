import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import { cn } from '@/align-ui/utils/cn';
import { NavigatorPanel, NavigatorPanelStack, NavigatorTextInput } from '../NavigatorPrimitives';

const Checkbox = AlignCheckbox.Root;

function RadioOption({ checked, onClick, children, className }: { checked: boolean; onClick: () => void; children?: ReactNode; className?: string })
{
    return (
        <button type="button" role="radio" aria-checked={ checked } className={ cn('flex cursor-pointer items-center gap-2 text-left', className) } onClick={ onClick }>
            <span className={ cn('flex size-3.5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset transition', checked ? 'bg-primary-base ring-primary-base' : 'bg-bg-white-0 ring-stroke-soft-200') }>
                { checked && <span className="size-1.5 rounded-full bg-static-white" /> }
            </span>
            { children && <span className="text-paragraph-xs text-text-strong-950">{ children }</span> }
        </button>
    );
}

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
        <NavigatorPanelStack>
            <NavigatorPanel>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.roomaccess.caption') }</span>
                        <span className="text-paragraph-xs leading-relaxed text-text-sub-600">{ LocalizeText('navigator.roomsettings.roomaccess.info') }</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.doormode') }</span>
                        <RadioOption checked={ (roomData.lockState === RoomDataParser.OPEN_STATE) && !isTryingPassword } onClick={ () => handleChange('lock_state', RoomDataParser.OPEN_STATE) }>
                            { LocalizeText('navigator.roomsettings.doormode.open') }
                        </RadioOption>
                        <RadioOption checked={ (roomData.lockState === RoomDataParser.DOORBELL_STATE) && !isTryingPassword } onClick={ () => handleChange('lock_state', RoomDataParser.DOORBELL_STATE) }>
                            { LocalizeText('navigator.roomsettings.doormode.doorbell') }
                        </RadioOption>
                        <RadioOption checked={ (roomData.lockState === RoomDataParser.INVISIBLE_STATE) && !isTryingPassword } onClick={ () => handleChange('lock_state', RoomDataParser.INVISIBLE_STATE) }>
                            { LocalizeText('navigator.roomsettings.doormode.invisible') }
                        </RadioOption>
                        <div className="flex items-start gap-2">
                            <RadioOption checked={ (roomData.lockState === RoomDataParser.PASSWORD_STATE) || isTryingPassword } onClick={ () => setIsTryingPassword(true) } className="mt-0.5" />
                            <div className="flex flex-col gap-1.5 flex-1">
                                <span className="text-paragraph-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.doormode.password') }</span>
                                { (isTryingPassword || (roomData.lockState === RoomDataParser.PASSWORD_STATE)) && (
                                    <>
                                        <NavigatorTextInput type="password" value={ password } onChange={ event => setPassword(event.target.value) } placeholder={ LocalizeText('navigator.roomsettings.password') } onFocus={ () => setIsTryingPassword(true) } />
                                        { isTryingPassword && (password.length <= 0) &&
                                            <span className="text-subheading-2xs font-medium text-error-base">{ LocalizeText('navigator.roomsettings.passwordismandatory') }</span> }
                                        <NavigatorTextInput type="password" value={ confirmPassword } onChange={ event => setConfirmPassword(event.target.value) } onBlur={ saveRoomPassword } placeholder={ LocalizeText('navigator.roomsettings.passwordconfirm') } />
                                        { isTryingPassword && ((password.length > 0) && (password !== confirmPassword)) &&
                                            <span className="text-subheading-2xs font-medium text-error-base">{ LocalizeText('navigator.roomsettings.invalidconfirm') }</span> }
                                    </>
                                ) }
                            </div>
                        </div>
                    </div>
                </div>
            </NavigatorPanel>
            <NavigatorPanel>
                <div className="flex flex-col gap-2">
                    <span className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.pets') }</span>
                    <div className="flex items-center gap-2">
                        <Checkbox id="pets" checked={ roomData.allowPets } onCheckedChange={ val => handleChange('allow_pets', !!val) } />
                        <label htmlFor="pets" className="cursor-pointer text-paragraph-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.allowpets') }</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="petsEat" checked={ roomData.allowPetsEat } onCheckedChange={ val => handleChange('allow_pets_eat', !!val) } />
                        <label htmlFor="petsEat" className="cursor-pointer text-paragraph-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.allowfoodconsume') }</label>
                    </div>
                </div>
            </NavigatorPanel>
        </NavigatorPanelStack>
    );
};
