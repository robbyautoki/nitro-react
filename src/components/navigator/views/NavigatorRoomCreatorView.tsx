import { CreateFlatMessageComposer, HabboClubLevelEnum } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { GetClubMemberLevel, GetConfiguration, IRoomModel, LocalizeText, SendMessageComposer } from '../../../api';
import { useNavigator } from '../../../hooks';
import { Badge } from '@/components/ui/reui-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
    const getRoomModelImage = (modelName: string) => GetConfiguration<string>('images.url') + `/navigator/models/model_${ modelName }.png`;

    const selectModel = (model: IRoomModel, index: number) =>
    {
        if(!model || (model.clubLevel > GetClubMemberLevel())) return;
        setSelectedModelName(roomModels[index].name);
    };

    const createRoom = () =>
    {
        if(!name || name.length < 3) return;
        SendMessageComposer(new CreateFlatMessageComposer(name, description, 'model_' + selectedModelName, Number(category), Number(visitorsCount), tradesSetting));
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

    const canCreate = name && name.trim().length >= 3;

    return (
        <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                    <Label className="text-xs">{ LocalizeText('navigator.createroom.roomnameinfo') }</Label>
                    <Input
                        type="text"
                        value={ name }
                        maxLength={ 60 }
                        onChange={ e => setName(e.target.value) }
                        placeholder={ LocalizeText('navigator.createroom.roomnameinfo') }
                        className="h-8 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground/50">{ name.length }/60 Zeichen (min. 3)</p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <Label className="text-xs">{ LocalizeText('navigator.createroom.roomdescinfo') }</Label>
                    <Textarea
                        value={ description }
                        maxLength={ 255 }
                        onChange={ e => setDescription(e.target.value) }
                        placeholder={ LocalizeText('navigator.createroom.roomdescinfo') }
                        className="text-xs min-h-[60px] resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground/50">{ description.length }/255 Zeichen</p>
                </div>

                {/* Category + Max Visitors row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs">{ LocalizeText('navigator.category') }</Label>
                        <Select onValueChange={ val => setCategory(Number(val)) } value={ category ? String(category) : undefined }>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                { categories && categories.map(cat => (
                                    <SelectItem key={ cat.id } value={ String(cat.id) } className="text-xs">
                                        { LocalizeText(cat.name) }
                                    </SelectItem>
                                )) }
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">{ LocalizeText('navigator.maxvisitors') }</Label>
                        <Select onValueChange={ val => setVisitorsCount(Number(val)) } value={ visitorsCount ? String(visitorsCount) : undefined }>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                { maxVisitorsList && maxVisitorsList.map(value => (
                                    <SelectItem key={ value } value={ String(value) } className="text-xs">{ value }</SelectItem>
                                )) }
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Trade Setting */}
                <div className="space-y-1.5">
                    <Label className="text-xs">{ LocalizeText('navigator.tradesettings') }</Label>
                    <Select onValueChange={ val => setTradesSetting(Number(val)) } value={ String(tradesSetting) }>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0" className="text-xs">{ LocalizeText('navigator.roomsettings.trade_not_allowed') }</SelectItem>
                            <SelectItem value="1" className="text-xs">{ LocalizeText('navigator.roomsettings.trade_not_with_Controller') }</SelectItem>
                            <SelectItem value="2" className="text-xs">{ LocalizeText('navigator.roomsettings.trade_allowed') }</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Room Model Grid — 1:1 from v2 prototype */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Raum-Modell</Label>
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
                                            ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                            : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40',
                                        isDisabled && 'opacity-50 cursor-not-allowed'
                                    ) }
                                    disabled={ isDisabled }
                                >
                                    <div className="w-full aspect-square rounded-md overflow-hidden flex items-center justify-center bg-amber-100/30">
                                        <img
                                            src={ getRoomModelImage(model.name) }
                                            alt={ `Modell ${ model.name }` }
                                            className="w-full h-full object-contain"
                                            style={ { imageRendering: 'pixelated' } }
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                                        { model.tileSize } { LocalizeText('navigator.createroom.tilesize') }
                                    </span>
                                    { isSelected && (
                                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                        </div>
                                    ) }
                                    { !hcDisabled && isHc && (
                                        <Badge variant="warning-light" size="xs" className="absolute top-1 left-1 text-[8px]">HC</Badge>
                                    ) }
                                </button>
                            );
                        }) }
                    </div>
                </div>

                {/* Create Button */}
                <Button className="w-full gap-2" disabled={ !canCreate } onClick={ createRoom }>
                    <Plus className="w-4 h-4" />
                    { LocalizeText('navigator.createroom.create') }
                </Button>
            </div>
        </ScrollArea>
    );
}
