import { RoomDeleteComposer, RoomSettingsSaveErrorEvent, RoomSettingsSaveErrorParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { CreateLinkEvent, GetMaxVisitorsList, IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { useMessageEvent, useNavigator, useNotification } from '../../../../hooks';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Frame, FramePanel } from '@/components/ui/frame';
import { Trash2 } from 'lucide-react';

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
        <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-[80px] shrink-0">{ LocalizeText('navigator.roomname') }</label>
                        <div className="flex-1 flex flex-col gap-0.5">
                            <Input className="h-7 text-xs" value={ roomName } maxLength={ ROOM_NAME_MAX_LENGTH } onChange={ event => setRoomName(event.target.value) } onBlur={ saveRoomName } />
                            { (roomName.length < ROOM_NAME_MIN_LENGTH) &&
                                <span className="text-[10px] text-destructive font-medium">{ LocalizeText('navigator.roomsettings.roomnameismandatory') }</span> }
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <label className="text-xs text-muted-foreground w-[80px] shrink-0 pt-1.5">{ LocalizeText('navigator.roomsettings.desc') }</label>
                        <Textarea className="flex-1 text-xs resize-none min-h-[50px]" value={ roomDescription } maxLength={ DESC_MAX_LENGTH } onChange={ event => setRoomDescription(event.target.value) } onBlur={ saveRoomDescription } />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-[80px] shrink-0">{ LocalizeText('navigator.category') }</label>
                        <Select value={ String(roomData.categoryId) } onValueChange={ val => handleChange('category', val) }>
                            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                { categories && categories.map(category => (
                                    <SelectItem key={ category.id } value={ String(category.id) } className="text-xs">{ LocalizeText(category.name) }</SelectItem>
                                )) }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-[80px] shrink-0">{ LocalizeText('navigator.maxvisitors') }</label>
                        <Select value={ String(roomData.userCount) } onValueChange={ val => handleChange('max_visitors', val) }>
                            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                { GetMaxVisitorsList && GetMaxVisitorsList.map(value => (
                                    <SelectItem key={ value } value={ String(value) } className="text-xs">{ value }</SelectItem>
                                )) }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-[80px] shrink-0">{ LocalizeText('navigator.tradesettings') }</label>
                        <Select value={ String(roomData.tradeState) } onValueChange={ val => handleChange('trade_state', val) }>
                            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="0" className="text-xs">{ LocalizeText('navigator.roomsettings.trade_not_allowed') }</SelectItem>
                                <SelectItem value="1" className="text-xs">{ LocalizeText('navigator.roomsettings.trade_not_with_Controller') }</SelectItem>
                                <SelectItem value="2" className="text-xs">{ LocalizeText('navigator.roomsettings.trade_allowed') }</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground w-[80px] shrink-0">{ LocalizeText('navigator.tags') }</label>
                        <div className="flex-1 flex gap-1.5">
                            <div className="flex-1 flex flex-col gap-0.5">
                                <Input className="h-7 text-xs" value={ roomTag1 } placeholder="Tag 1" onChange={ event => setRoomTag1(event.target.value) } onBlur={ () => saveTags(0) } />
                                { (roomTag1.length > TAGS_MAX_LENGTH) && <span className="text-[10px] text-destructive">{ LocalizeText('navigator.roomsettings.toomanycharacters') }</span> }
                                { (tagIndex === 0 && typeError !== '') && <span className="text-[10px] text-destructive">{ LocalizeText(typeError) }</span> }
                            </div>
                            <div className="flex-1 flex flex-col gap-0.5">
                                <Input className="h-7 text-xs" value={ roomTag2 } placeholder="Tag 2" onChange={ event => setRoomTag2(event.target.value) } onBlur={ () => saveTags(1) } />
                                { (roomTag2.length > TAGS_MAX_LENGTH) && <span className="text-[10px] text-destructive">{ LocalizeText('navigator.roomsettings.toomanycharacters') }</span> }
                                { (tagIndex === 1 && typeError !== '') && <span className="text-[10px] text-destructive">{ LocalizeText(typeError) }</span> }
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-[88px]">
                        <Checkbox id="walkthrough" checked={ roomData.allowWalkthrough } onCheckedChange={ val => handleChange('allow_walkthrough', !!val) } />
                        <label htmlFor="walkthrough" className="text-xs cursor-pointer">{ LocalizeText('navigator.roomsettings.allow_walk_through') }</label>
                    </div>
                    <div className="flex justify-center pt-1">
                        <button className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors" onClick={ deleteRoom }>
                            <Trash2 className="w-3 h-3" />
                            { LocalizeText('navigator.roomsettings.delete') }
                        </button>
                    </div>
                </div>
            </FramePanel>
        </Frame>
    );
};
