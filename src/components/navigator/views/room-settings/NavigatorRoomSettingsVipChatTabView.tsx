import { RoomChatSettings } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-200">{ LocalizeText('navigator.roomsettings.vip.caption') }</span>
                <span className="text-[11px] text-zinc-500 leading-relaxed">{ LocalizeText('navigator.roomsettings.vip.info') }</span>
            </div>

            <div className="flex gap-3 overflow-auto">
                <div className="flex-1 flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-200">{ LocalizeText('navigator.roomsettings.chat_settings') }</span>
                    <span className="text-[11px] text-zinc-500">{ LocalizeText('navigator.roomsettings.chat_settings.info') }</span>

                    <Select value={ String(roomData.chatSettings.mode) } onValueChange={ val => handleChange('bubble_mode', val) }>
                        <SelectTrigger className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white z-[500]">
                            <SelectItem value={ String(RoomChatSettings.CHAT_MODE_FREE_FLOW) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.mode.free.flow') }</SelectItem>
                            <SelectItem value={ String(RoomChatSettings.CHAT_MODE_LINE_BY_LINE) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.mode.line.by.line') }</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={ String(roomData.chatSettings.weight) } onValueChange={ val => handleChange('chat_weight', val) }>
                        <SelectTrigger className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white z-[500]">
                            <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.bubbles.width.normal') }</SelectItem>
                            <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_THIN) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.bubbles.width.thin') }</SelectItem>
                            <SelectItem value={ String(RoomChatSettings.CHAT_BUBBLE_WIDTH_WIDE) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.bubbles.width.wide') }</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={ String(roomData.chatSettings.speed) } onValueChange={ val => handleChange('bubble_speed', val) }>
                        <SelectTrigger className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white z-[500]">
                            <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_FAST) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.speed.fast') }</SelectItem>
                            <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_NORMAL) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.speed.normal') }</SelectItem>
                            <SelectItem value={ String(RoomChatSettings.CHAT_SCROLL_SPEED_SLOW) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.speed.slow') }</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={ String(roomData.chatSettings.protection) } onValueChange={ val => handleChange('flood_protection', val) }>
                        <SelectTrigger className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white z-[500]">
                            <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_LOOSE) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.flood.loose') }</SelectItem>
                            <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_NORMAL) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.flood.normal') }</SelectItem>
                            <SelectItem value={ String(RoomChatSettings.FLOOD_FILTER_STRICT) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.chat.flood.strict') }</SelectItem>
                        </SelectContent>
                    </Select>

                    <span className="text-[11px] text-zinc-400">{ LocalizeText('navigator.roomsettings.chat_settings.hearing.distance') }</span>
                    <Input type="number" min="0" className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white focus-visible:bg-white/15" value={ chatDistance } onChange={ event => setChatDistance(event.target.valueAsNumber) } onBlur={ () => handleChange('chat_distance', chatDistance) } />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-200">{ LocalizeText('navigator.roomsettings.vip_settings') }</span>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-sky-400 w-3.5 h-3.5" checked={ roomData.hideWalls } onChange={ event => handleChange('hide_walls', event.target.checked) } />
                        <span className="text-xs text-zinc-300">{ LocalizeText('navigator.roomsettings.hide_walls') }</span>
                    </label>

                    <Select value={ String(roomData.wallThickness) } onValueChange={ val => handleChange('wall_thickness', val) }>
                        <SelectTrigger className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white z-[500]">
                            <SelectItem value="0" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.wall_thickness.normal') }</SelectItem>
                            <SelectItem value="1" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.wall_thickness.thick') }</SelectItem>
                            <SelectItem value="-1" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.wall_thickness.thin') }</SelectItem>
                            <SelectItem value="-2" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.wall_thickness.thinnest') }</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={ String(roomData.floorThickness) } onValueChange={ val => handleChange('floor_thickness', val) }>
                        <SelectTrigger className="h-7 text-xs rounded-lg bg-white/10 border-0 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white z-[500]">
                            <SelectItem value="0" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.floor_thickness.normal') }</SelectItem>
                            <SelectItem value="1" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.floor_thickness.thick') }</SelectItem>
                            <SelectItem value="-1" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.floor_thickness.thin') }</SelectItem>
                            <SelectItem value="-2" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.floor_thickness.thinnest') }</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
