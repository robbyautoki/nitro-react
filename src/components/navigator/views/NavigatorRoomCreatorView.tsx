import { CreateFlatMessageComposer, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetClubMemberLevel, GetConfiguration, IRoomModel, LocalizeText, SendMessageComposer } from '../../../api';
import { useNavigator } from '../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSelect from '@/align-ui/components/ui/select';
import { cn } from '@/align-ui/utils/cn';
import { NavPlusIcon, NavigatorScrollViewport, NavigatorTextInput, NavigatorTextarea, PixelIcon } from './NavigatorPrimitives';

const Select = AlignSelect.Root;
const SelectTrigger = AlignSelect.Trigger;
const SelectValue = AlignSelect.Value;
const SelectContent = AlignSelect.Content;
const SelectItem = AlignSelect.Item;

export const NavigatorRoomCreatorView: FC<{}> = props =>
{
    const [ maxVisitorsList, setMaxVisitorsList ] = useState<number[]>(null);
    const [ name, setName ] = useState('');
    const [ description, setDescription ] = useState('');
    const [ category, setCategory ] = useState<number>(null);
    const [ visitorsCount, setVisitorsCount ] = useState<number>(null);
    const [ tradesSetting, setTradesSetting ] = useState<number>(0);
    const [ roomModels, setRoomModels ] = useState<IRoomModel[]>([]);
    const [ selectedModelName, setSelectedModelName ] = useState('');
    const { categories = null } = useNavigator();

    const hcDisabled = GetConfiguration<boolean>('hc.disabled', false);
    const getRoomModelImage = (modelName: string) =>
    {
        const imageLibraryUrl = GetConfiguration<string>('image.library.url', '');
        const normalizedUrl = imageLibraryUrl.endsWith('/') ? imageLibraryUrl : `${ imageLibraryUrl }/`;

        return `${ normalizedUrl }newroom/model_${ modelName }.png`;
    };

    const selectModel = (model: IRoomModel, index: number) =>
    {
        if(!model || (!hcDisabled && (model.clubLevel > GetClubMemberLevel()))) return;
        setSelectedModelName(roomModels[index].name);
    };

    const createRoom = () =>
    {
        const trimmedName = name.trim();

        if(!trimmedName || (trimmedName.length < 3) || !selectedModelName || (category === null) || (visitorsCount === null)) return;

        SendMessageComposer(new CreateFlatMessageComposer(trimmedName, description, 'model_' + selectedModelName, Number(category), Number(visitorsCount), tradesSetting));
    };

    useEffect(() =>
    {
        if(!maxVisitorsList)
        {
            const list = [];
            for(let i = 10; i <= 100; i += 10) list.push(i);
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

    const canCreate = !!name && (name.trim().length >= 3) && !!selectedModelName && (category !== null) && (visitorsCount !== null);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <NavigatorScrollViewport className="min-h-0 flex-1">
                <div className="p-4 space-y-4">
                    { /* Name */ }
                    <div className="space-y-1.5">
                        <label className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.createroom.roomnameinfo') }</label>
                        <NavigatorTextInput
                            type="text"
                            value={ name }
                            maxLength={ 60 }
                            onChange={ e => setName(e.target.value) }
                            placeholder={ LocalizeText('navigator.createroom.roomnameinfo') }
                        />
                        <p className="text-subheading-2xs text-text-soft-400">{ name.length }/60 Zeichen (min. 3)</p>
                    </div>
                    { /* Description */ }
                    <div className="space-y-1.5">
                        <label className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.createroom.roomdescinfo') }</label>
                        <NavigatorTextarea
                            value={ description }
                            maxLength={ 255 }
                            onChange={ e => setDescription(e.target.value) }
                            placeholder={ LocalizeText('navigator.createroom.roomdescinfo') }
                            className="min-h-[60px]"
                        />
                        <p className="text-subheading-2xs text-text-soft-400">{ description.length }/255 Zeichen</p>
                    </div>
                    { /* Category + Max Visitors row */ }
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.category') }</label>
                            <Select size="xsmall" onValueChange={ val => setCategory(Number(val)) } value={ category !== null ? String(category) : undefined }>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { categories && categories.map(cat => (
                                        <SelectItem key={ cat.id } value={ String(cat.id) }>
                                            { LocalizeText(cat.name) }
                                        </SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.maxvisitors') }</label>
                            <Select size="xsmall" onValueChange={ val => setVisitorsCount(Number(val)) } value={ visitorsCount !== null ? String(visitorsCount) : undefined }>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    { maxVisitorsList && maxVisitorsList.map(value => (
                                        <SelectItem key={ value } value={ String(value) }>{ value }</SelectItem>
                                    )) }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    { /* Trade Setting */ }
                    <div className="space-y-1.5">
                        <label className="text-label-xs text-text-strong-950">{ LocalizeText('navigator.tradesettings') }</label>
                        <Select size="xsmall" onValueChange={ val => setTradesSetting(Number(val)) } value={ String(tradesSetting) }>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">{ LocalizeText('navigator.roomsettings.trade_not_allowed') }</SelectItem>
                                <SelectItem value="1">{ LocalizeText('navigator.roomsettings.trade_not_with_Controller') }</SelectItem>
                                <SelectItem value="2">{ LocalizeText('navigator.roomsettings.trade_allowed') }</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    { /* Room Model Grid — 1:1 from v2 prototype */ }
                    <div className="space-y-1.5">
                        <label className="text-label-xs text-text-strong-950">Raum-Modell</label>
                        <div className="grid grid-cols-3 gap-2">
                            { roomModels.map((model, index) =>
                            {
                                const isSelected = selectedModelName === model.name;
                                const isHc = model.clubLevel > HabboClubLevelEnum.NO_CLUB;
                                const isDisabled = !hcDisabled && isHc && GetClubMemberLevel() < model.clubLevel;

                                return (
                                    <button
                                        key={ model.name }
                                        onClick={ () => selectModel(model, index) }
                                        className={ cn(
                                            'relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                                            isSelected
                                                ? 'border-primary-base bg-primary-alpha-10 shadow-regular-xs ring-1 ring-primary-base'
                                                : 'border-stroke-soft-200 bg-bg-white-0 hover:bg-bg-weak-50',
                                            isDisabled && 'opacity-50 cursor-not-allowed'
                                        ) }
                                        disabled={ isDisabled }
                                    >
                                        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-bg-weak-50">
                                            <img
                                                src={ getRoomModelImage(model.name) }
                                                alt={ `Modell ${ model.name }` }
                                                className="w-full h-full object-contain"
                                                style={ { imageRendering: 'pixelated' } }
                                            />
                                        </div>
                                        <span className="text-subheading-2xs font-medium tabular-nums text-text-sub-600">
                                            { model.tileSize } { LocalizeText('navigator.createroom.tilesize') }
                                        </span>
                                        { isSelected && (
                                            <div className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary-base">
                                                <PixelIcon src="/navigator/icons/tick.png" size="size-2.5" alt="ausgewählt" />
                                            </div>
                                        ) }
                                        { !hcDisabled && isHc && (
                                            <AlignBadge.Root color="orange" variant="light" size="small" className="absolute left-1 top-1 h-4 px-1 text-[8px]">HC</AlignBadge.Root>
                                        ) }
                                    </button>
                                );
                            }) }
                        </div>
                    </div>
                </div>
            </NavigatorScrollViewport>
            <div className="shrink-0 border-t border-stroke-soft-200 bg-bg-white-0 p-4">
                <AlignButton.Root type="button" variant="primary" mode="filled" size="small" className="w-full gap-2" disabled={ !canCreate } onClick={ createRoom }>
                    <AlignButton.Icon as={ NavPlusIcon } className="size-4" />
                    { LocalizeText('navigator.createroom.create') }
                </AlignButton.Root>
            </div>
        </div>
    );
}
