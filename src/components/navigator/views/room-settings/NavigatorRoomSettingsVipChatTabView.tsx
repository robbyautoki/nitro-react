import { RoomChatSettings } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import * as AlignSelect from '@/align-ui/components/ui/select';
import { NavigatorPanel, NavigatorPanelStack, NavigatorTextInput } from '../NavigatorPrimitives';

const Checkbox = AlignCheckbox.Root;
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

export const NavigatorRoomSettingsVipChatTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null } = props;
    const [ chatDistance, setChatDistance ] = useState<number>(0);

    useEffect(() =>
    {
        setChatDistance(roomData.chatSettings.distance);
    }, [ roomData.chatSettings ]);

    return (
        <NavigatorPanelStack>
            <NavigatorPanel>
                <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-2">
                        <span className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.chat_settings') }</span>
                        <Select size="xsmall" value={ String(roomData.chatSettings.mode) } onValueChange={ val => handleChange('bubble_mode', val) }>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value={ String(RoomChatSettings.CHAT_MODE_FREE_FLOW) }>{ LocalizeText('navigator.roomsettings.chat.mode.free.flow') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_MODE_LINE_BY_LINE) }>{ LocalizeText('navigator.roomsettings.chat.mode.line.by.line') }</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select size="xsmall" value={ String(roomData.chatSettings.weight) } onValueChange={ val => handleChange('chat_weight', val) }>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL) }>{ LocalizeText('navigator.roomsettings.chat.bubbles.width.normal') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_THIN) }>{ LocalizeText('navigator.roomsettings.chat.bubbles.width.thin') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_WIDE) }>{ LocalizeText('navigator.roomsettings.chat.bubbles.width.wide') }</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select size="xsmall" value={ String(roomData.chatSettings.speed) } onValueChange={ val => handleChange('bubble_speed', val) }>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_FAST) }>{ LocalizeText('navigator.roomsettings.chat.speed.fast') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_NORMAL) }>{ LocalizeText('navigator.roomsettings.chat.speed.normal') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_SLOW) }>{ LocalizeText('navigator.roomsettings.chat.speed.slow') }</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select size="xsmall" value={ String(roomData.chatSettings.protection) } onValueChange={ val => handleChange('flood_protection', val) }>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_LOOSE) }>{ LocalizeText('navigator.roomsettings.chat.flood.loose') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_NORMAL) }>{ LocalizeText('navigator.roomsettings.chat.flood.normal') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_STRICT) }>{ LocalizeText('navigator.roomsettings.chat.flood.strict') }</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex flex-col gap-1">
                            <span className="text-paragraph-xs text-text-sub-600">{ LocalizeText('navigator.roomsettings.chat_settings.hearing.distance') }</span>
                            <NavigatorTextInput type="number" min="0" value={ chatDistance } onChange={ event => setChatDistance(event.target.valueAsNumber) } onBlur={ () => handleChange('chat_distance', chatDistance) } />
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        <span className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.vip_settings') }</span>
                        <div className="flex items-center gap-2">
                            <Checkbox id="hideWalls" checked={ roomData.hideWalls } onCheckedChange={ val => handleChange('hide_walls', !!val) } />
                            <label htmlFor="hideWalls" className="cursor-pointer text-paragraph-xs text-text-strong-950">{ LocalizeText('navigator.roomsettings.hide_walls') }</label>
                        </div>
                        <Select size="xsmall" value={ String(roomData.wallThickness) } onValueChange={ val => handleChange('wall_thickness', val) }>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="0">{ LocalizeText('navigator.roomsettings.wall_thickness.normal') }</SelectItem>
                                <SelectItem value="1">{ LocalizeText('navigator.roomsettings.wall_thickness.thick') }</SelectItem>
                                <SelectItem value="-1">{ LocalizeText('navigator.roomsettings.wall_thickness.thin') }</SelectItem>
                                <SelectItem value="-2">{ LocalizeText('navigator.roomsettings.wall_thickness.thinnest') }</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select size="xsmall" value={ String(roomData.floorThickness) } onValueChange={ val => handleChange('floor_thickness', val) }>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="z-[9999]">
                                <SelectItem value="0">{ LocalizeText('navigator.roomsettings.floor_thickness.normal') }</SelectItem>
                                <SelectItem value="1">{ LocalizeText('navigator.roomsettings.floor_thickness.thick') }</SelectItem>
                                <SelectItem value="-1">{ LocalizeText('navigator.roomsettings.floor_thickness.thin') }</SelectItem>
                                <SelectItem value="-2">{ LocalizeText('navigator.roomsettings.floor_thickness.thinnest') }</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </NavigatorPanel>
        </NavigatorPanelStack>
    );
}
