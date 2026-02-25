import { RoomChatSettings } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Frame, FramePanel } from '@/components/ui/frame';

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
        <Frame stacked spacing="sm" className="w-full">
            <FramePanel>
                <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-2">
                        <span className="text-xs font-medium">{ LocalizeText('navigator.roomsettings.chat_settings') }</span>

                        <Select value={ String(roomData.chatSettings.mode) } onValueChange={ val => handleChange('bubble_mode', val) }>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ String(RoomChatSettings.CHAT_MODE_FREE_FLOW) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.mode.free.flow') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_MODE_LINE_BY_LINE) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.mode.line.by.line') }</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={ String(roomData.chatSettings.weight) } onValueChange={ val => handleChange('chat_weight', val) }>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.bubbles.width.normal') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_THIN) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.bubbles.width.thin') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_WIDE) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.bubbles.width.wide') }</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={ String(roomData.chatSettings.speed) } onValueChange={ val => handleChange('bubble_speed', val) }>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_FAST) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.speed.fast') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_NORMAL) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.speed.normal') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_SLOW) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.speed.slow') }</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={ String(roomData.chatSettings.protection) } onValueChange={ val => handleChange('flood_protection', val) }>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_LOOSE) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.flood.loose') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_NORMAL) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.flood.normal') }</SelectItem>
                                <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_STRICT) } className="text-xs">{ LocalizeText('navigator.roomsettings.chat.flood.strict') }</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-muted-foreground">{ LocalizeText('navigator.roomsettings.chat_settings.hearing.distance') }</span>
                            <Input type="number" min="0" className="h-7 text-xs" value={ chatDistance } onChange={ event => setChatDistance(event.target.valueAsNumber) } onBlur={ () => handleChange('chat_distance', chatDistance) } />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        <span className="text-xs font-medium">{ LocalizeText('navigator.roomsettings.vip_settings') }</span>

                        <div className="flex items-center gap-2">
                            <Checkbox id="hideWalls" checked={ roomData.hideWalls } onCheckedChange={ val => handleChange('hide_walls', !!val) } />
                            <label htmlFor="hideWalls" className="text-xs cursor-pointer">{ LocalizeText('navigator.roomsettings.hide_walls') }</label>
                        </div>

                        <Select value={ String(roomData.wallThickness) } onValueChange={ val => handleChange('wall_thickness', val) }>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0" className="text-xs">{ LocalizeText('navigator.roomsettings.wall_thickness.normal') }</SelectItem>
                                <SelectItem value="1" className="text-xs">{ LocalizeText('navigator.roomsettings.wall_thickness.thick') }</SelectItem>
                                <SelectItem value="-1" className="text-xs">{ LocalizeText('navigator.roomsettings.wall_thickness.thin') }</SelectItem>
                                <SelectItem value="-2" className="text-xs">{ LocalizeText('navigator.roomsettings.wall_thickness.thinnest') }</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={ String(roomData.floorThickness) } onValueChange={ val => handleChange('floor_thickness', val) }>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0" className="text-xs">{ LocalizeText('navigator.roomsettings.floor_thickness.normal') }</SelectItem>
                                <SelectItem value="1" className="text-xs">{ LocalizeText('navigator.roomsettings.floor_thickness.thick') }</SelectItem>
                                <SelectItem value="-1" className="text-xs">{ LocalizeText('navigator.roomsettings.floor_thickness.thin') }</SelectItem>
                                <SelectItem value="-2" className="text-xs">{ LocalizeText('navigator.roomsettings.floor_thickness.thinnest') }</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FramePanel>
        </Frame>
    );
}
