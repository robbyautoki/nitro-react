import { RoomDeleteComposer, RoomSettingsSaveErrorEvent, RoomSettingsSaveErrorParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { CreateLinkEvent, GetMaxVisitorsList, IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { useMessageEvent, useNavigator, useNotification } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import * as AlignSelect from '@/align-ui/components/ui/select';
import { NavTrashIcon, NavigatorPanel, NavigatorPanelStack, NavigatorTextInput, NavigatorTextarea } from '../NavigatorPrimitives';

const Checkbox = AlignCheckbox.Root;
const Select = AlignSelect.Root;
const SelectTrigger = AlignSelect.Trigger;
const SelectValue = AlignSelect.Value;
const SelectContent = AlignSelect.Content;
const SelectItem = AlignSelect.Item;

const ROOM_NAME_MIN_LENGTH = 3;
const ROOM_NAME_MAX_LENGTH = 60;
const DESC_MAX_LENGTH = 255;
const TAGS_MAX_LENGTH = 15;

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean | string[]) => void;
    onClose: () => void;
}

export const NavigatorRoomSettingsBasicTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null, onClose = null } = props;
    const [ roomName, setRoomName ] = useState<string>('');
    const [ roomDescription, setRoomDescription ] = useState<string>('');
    const [ roomTag1, setRoomTag1 ] = useState<string>('');
    const [ roomTag2, setRoomTag2 ] = useState<string>('');
    const [ tagIndex, setTagIndex ] = useState(0);
    const [ typeError, setTypeError ] = useState<string>('');
    const { showConfirm = null } = useNotification();
    const { categories = null } = useNavigator();

    useMessageEvent<RoomSettingsSaveErrorEvent>(RoomSettingsSaveErrorEvent, event =>
    {
        const parser = event.getParser();

        if (!parser) return;

        switch (parser.code)
        {
            case RoomSettingsSaveErrorParser.ERROR_INVALID_TAG:
                setTypeError('navigator.roomsettings.unacceptablewords');
            case RoomSettingsSaveErrorParser.ERROR_NON_USER_CHOOSABLE_TAG:
                setTypeError('navigator.roomsettings.nonuserchoosabletag');
                break;
            default:
                setTypeError('');
                break;
        }
    });

    const deleteRoom = () =>
    {
        showConfirm(LocalizeText('navigator.roomsettings.deleteroom.confirm.message', [ 'room_name' ], [ roomData.roomName ] ), () =>
        {
            SendMessageComposer(new RoomDeleteComposer(roomData.roomId));
            if(onClose) onClose();
            CreateLinkEvent('navigator/search/myworld_view');
        },
        null, null, null, LocalizeText('navigator.roomsettings.deleteroom.confirm.title'));
    }

    const saveRoomName = () =>
    {
        if((roomName === roomData.roomName) || (roomName.length < ROOM_NAME_MIN_LENGTH) || (roomName.length > ROOM_NAME_MAX_LENGTH)) return;
        handleChange('name', roomName);
    }

    const saveRoomDescription = () =>
    {
        if((roomDescription === roomData.roomDescription) || (roomDescription.length > DESC_MAX_LENGTH)) return;
        handleChange('description', roomDescription);
    }

    const saveTags = (index: number) =>
    {
        if(index === 0 && (roomTag1 === roomData.tags[0]) || (roomTag1.length > TAGS_MAX_LENGTH)) return;
        if(index === 1 && (roomTag2 === roomData.tags[1]) || (roomTag2.length > TAGS_MAX_LENGTH)) return;
        if(roomTag1 === '' && roomTag2 !== '') setRoomTag2('');

        setTypeError('');
        setTagIndex(index);
        handleChange('tags', (roomTag1 === '' && roomTag2 !== '') ? [ roomTag2 ] : [ roomTag1, roomTag2 ]);
    }

    useEffect(() =>
    {
        setRoomName(roomData.roomName);
        setRoomDescription(roomData.roomDescription);
        setRoomTag1((roomData.tags.length > 0 && roomData.tags[0]) ? roomData.tags[0] : '');
        setRoomTag2((roomData.tags.length > 0 && roomData.tags[1]) ? roomData.tags[1] : '');
    }, [ roomData ]);

    return (
        <NavigatorPanelStack>
            <NavigatorPanel>
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                        <label className="w-[80px] shrink-0 text-paragraph-xs text-text-sub-600">{ LocalizeText('navigator.roomname') }</label>
                        <div className="flex-1 flex flex-col gap-0.5">
                            <NavigatorTextInput value={ roomName } maxLength={ ROOM_NAME_MAX_LENGTH } onChange={ event => setRoomName(event.target.value) } onBlur={ saveRoomName } />
                            { (roomName.length < ROOM_NAME_MIN_LENGTH) &&
                                <span className="text-subheading-2xs font-medium text-error-base">{ LocalizeText('navigator.roomsettings.roomnameismandatory') }</span> }
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <label className="w-[80px] shrink-0 pt-1.5 text-paragraph-xs text-text-sub-600">{ LocalizeText('navigator.roomsettings.desc') }</label>
                        <NavigatorTextarea className="min-h-[50px] flex-1" value={ roomDescription } maxLength={ DESC_MAX_LENGTH } onChange={ event => setRoomDescription(event.target.value) } onBlur={ saveRoomDescription } />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-[80px] shrink-0 text-paragraph-xs text-text-sub-600">{ LocalizeText('navigator.category') }</label>
                        <Select size="xsmall" value={ String(roomData.categoryId) } onValueChange={ val => handleChange('category', val) }>
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                { categories && categories.map(category => (
                                    <SelectItem key={ category.id } value={ String(category.id) }>{ LocalizeText(category.name) }</SelectItem>
                                )) }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-[80px] shrink-0 text-paragraph-xs text-text-sub-600">{ LocalizeText('navigator.maxvisitors') }</label>
                        <Select size="xsmall" value={ String(roomData.userCount) } onValueChange={ val => handleChange('max_visitors', val) }>
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                { GetMaxVisitorsList && GetMaxVisitorsList.map(value => (
                                    <SelectItem key={ value } value={ String(value) }>{ value }</SelectItem>
                                )) }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-[80px] shrink-0 text-paragraph-xs text-text-sub-600">{ LocalizeText('navigator.tradesettings') }</label>
                        <Select size="xsmall" value={ String(roomData.tradeState) } onValueChange={ val => handleChange('trade_state', val) }>
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="0">{ LocalizeText('navigator.roomsettings.trade_not_allowed') }</SelectItem>
                                <SelectItem value="1">{ LocalizeText('navigator.roomsettings.trade_not_with_Controller') }</SelectItem>
                                <SelectItem value="2">{ LocalizeText('navigator.roomsettings.trade_allowed') }</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-[80px] shrink-0 text-paragraph-xs text-text-sub-600">{ LocalizeText('navigator.tags') }</label>
                        <div className="flex-1 flex gap-1.5">
                            <div className="flex-1 flex flex-col gap-0.5">
                                <NavigatorTextInput value={ roomTag1 } placeholder="Tag 1" onChange={ event => setRoomTag1(event.target.value) } onBlur={ () => saveTags(0) } />
                                { (roomTag1.length > TAGS_MAX_LENGTH) && <span className="text-subheading-2xs text-error-base">{ LocalizeText('navigator.roomsettings.toomanycharacters') }</span> }
                                { (tagIndex === 0 && typeError !== '') && <span className="text-subheading-2xs text-error-base">{ LocalizeText(typeError) }</span> }
                            </div>
                            <div className="flex-1 flex flex-col gap-0.5">
                                <NavigatorTextInput value={ roomTag2 } placeholder="Tag 2" onChange={ event => setRoomTag2(event.target.value) } onBlur={ () => saveTags(1) } />
                                { (roomTag2.length > TAGS_MAX_LENGTH) && <span className="text-subheading-2xs text-error-base">{ LocalizeText('navigator.roomsettings.toomanycharacters') }</span> }
                                { (tagIndex === 1 && typeError !== '') && <span className="text-subheading-2xs text-error-base">{ LocalizeText(typeError) }</span> }
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-[88px]">
                        <Checkbox id="walkthrough" checked={ roomData.allowWalkthrough } onCheckedChange={ val => handleChange('allow_walkthrough', !!val) } />
                        <label htmlFor="walkthrough" className="cursor-pointer text-paragraph-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.allow_walk_through') }</label>
                    </div>
                    <div className="flex justify-center pt-1">
                        <AlignButton.Root type="button" variant="error" mode="ghost" size="xsmall" onClick={ deleteRoom }>
                            <AlignButton.Icon as={ NavTrashIcon } className="size-3.5" />
                            { LocalizeText('navigator.roomsettings.delete') }
                        </AlignButton.Root>
                    </div>
                </div>
            </NavigatorPanel>
        </NavigatorPanelStack>
    );
};
