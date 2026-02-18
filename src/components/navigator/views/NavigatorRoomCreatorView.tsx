/* eslint-disable no-template-curly-in-string */
import { CreateFlatMessageComposer, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetClubMemberLevel, GetConfiguration, IRoomModel, LocalizeText, SendMessageComposer } from '../../../api';
import { LayoutCurrencyIcon } from '../../../common';
import { useNavigator } from '../../../hooks';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const NavigatorRoomCreatorView: FC<{}> = props =>
{
    const [ maxVisitorsList, setMaxVisitorsList ] = useState<number[]>(null);
    const [ name, setName ] = useState<string>(null);
    const [ description, setDescription ] = useState<string>(null);
    const [ category, setCategory ] = useState<number>(null);
    const [ visitorsCount, setVisitorsCount ] = useState<number>(null);
    const [ tradesSetting, setTradesSetting ] = useState<number>(0);
    const [ roomModels, setRoomModels ] = useState<IRoomModel[]>([]);
    const [ selectedModelName, setSelectedModelName ] = useState<string>('');
    const { categories = null } = useNavigator();

    const hcDisabled = GetConfiguration<boolean>('hc.disabled', false);

    const getRoomModelImage = (name: string) => GetConfiguration<string>('images.url') + `/navigator/models/model_${ name }.png`;

    const selectModel = (model: IRoomModel, index: number) =>
    {
        if(!model || (model.clubLevel > GetClubMemberLevel())) return;

        setSelectedModelName(roomModels[index].name);
    };

    const createRoom = () =>
    {
        SendMessageComposer(new CreateFlatMessageComposer(name, description, 'model_' + selectedModelName, Number(category), Number(visitorsCount), tradesSetting));
    };

    useEffect(() =>
    {
        if(!maxVisitorsList)
        {
            const list = [];

            for(let i = 10; i <= 100; i = i + 10) list.push(i);

            setMaxVisitorsList(list);
            setVisitorsCount(list[0]);
        }
    }, [ maxVisitorsList ]);

    useEffect(() =>
    {
        if(categories && categories.length) setCategory(categories[0].id);
    }, [ categories ]);

    useEffect(() =>
    {
        const models = GetConfiguration<IRoomModel[]>('navigator.room.models');

        if(models && models.length)
        {
            setRoomModels(models);
            setSelectedModelName(models[0].name);
        }
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden p-3 gap-2">
            <div className="flex flex-1 gap-2 overflow-hidden min-h-0">
                { /* ── Left Column: Form Fields ── */ }
                <div className="flex flex-col gap-1.5 w-1/2 overflow-auto">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-zinc-300">{ LocalizeText('navigator.createroom.roomnameinfo') }</label>
                        <Input
                            type="text"
                            maxLength={ 60 }
                            onChange={ event => setName(event.target.value) }
                            placeholder={ LocalizeText('navigator.createroom.roomnameinfo') }
                            className="h-8 text-xs rounded-lg bg-white/10 border-0 text-white placeholder:text-zinc-500 focus-visible:bg-white/15"
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-xs font-medium text-zinc-300">{ LocalizeText('navigator.createroom.roomdescinfo') }</label>
                        <Textarea
                            maxLength={ 255 }
                            onChange={ event => setDescription(event.target.value) }
                            placeholder={ LocalizeText('navigator.createroom.roomdescinfo') }
                            className="flex-1 text-xs rounded-lg resize-none min-h-[60px] bg-white/10 border-0 text-white placeholder:text-zinc-500 focus-visible:bg-white/15"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-zinc-300">{ LocalizeText('navigator.category') }</label>
                        <Select onValueChange={ (val) => setCategory(Number(val)) } value={ category ? String(category) : undefined }>
                            <SelectTrigger className="h-8 text-xs rounded-lg bg-white/10 border-0 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white">
                                { categories && (categories.length > 0) && categories.map(cat => (
                                    <SelectItem key={ cat.id } value={ String(cat.id) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">
                                        { LocalizeText(cat.name) }
                                    </SelectItem>
                                )) }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-zinc-300">{ LocalizeText('navigator.maxvisitors') }</label>
                        <Select onValueChange={ (val) => setVisitorsCount(Number(val)) } value={ visitorsCount ? String(visitorsCount) : undefined }>
                            <SelectTrigger className="h-8 text-xs rounded-lg bg-white/10 border-0 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white">
                                { maxVisitorsList && maxVisitorsList.map(value => (
                                    <SelectItem key={ value } value={ String(value) } className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">
                                        { value }
                                    </SelectItem>
                                )) }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-zinc-300">{ LocalizeText('navigator.tradesettings') }</label>
                        <Select onValueChange={ (val) => setTradesSetting(Number(val)) } value={ String(tradesSetting) }>
                            <SelectTrigger className="h-8 text-xs rounded-lg bg-white/10 border-0 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white">
                                <SelectItem value="0" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.trade_not_allowed') }</SelectItem>
                                <SelectItem value="1" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.trade_not_with_Controller') }</SelectItem>
                                <SelectItem value="2" className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white">{ LocalizeText('navigator.roomsettings.trade_allowed') }</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                { /* ── Right Column: Room Model Thumbnails ── */ }
                <div className="w-1/2 overflow-auto">
                    <div className="grid grid-cols-2 gap-1.5">
                        { roomModels.map((model, index) =>
                        {
                            const isDisabled = GetClubMemberLevel() < model.clubLevel;

                            return (
                                <div
                                    key={ model.name }
                                    onClick={ () => selectModel(model, index) }
                                    className={ cn(
                                        'relative flex flex-col items-center justify-between cursor-pointer rounded-lg p-1 border transition-all duration-150',
                                        selectedModelName === model.name
                                            ? 'border-sky-400/60 bg-white/15 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                                            : 'border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/10',
                                        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                                    ) }
                                >
                                    <div className="flex-1 flex items-center justify-center overflow-hidden w-full">
                                        <img alt="" src={ getRoomModelImage(model.name) } className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-center leading-tight mt-0.5 text-zinc-300">
                                        { model.tileSize } { LocalizeText('navigator.createroom.tilesize') }
                                    </span>
                                    { !hcDisabled && model.clubLevel > HabboClubLevelEnum.NO_CLUB &&
                                        <LayoutCurrencyIcon position="absolute" className="top-1 right-1" type="hc" /> }
                                </div>
                            );
                        }) }
                    </div>
                </div>
            </div>
            <Button
                className="w-full rounded-lg h-9 shadow-sm transition-all duration-200 disabled:opacity-40 bg-sky-500 hover:bg-sky-400 text-white"
                onClick={ createRoom }
                disabled={ !name || (name.length < 3) }
            >
                { LocalizeText('navigator.createroom.create') }
            </Button>
        </div>
    );
}
