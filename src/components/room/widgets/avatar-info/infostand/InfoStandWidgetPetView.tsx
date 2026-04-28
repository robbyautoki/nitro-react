import { PetRespectComposer, PetType } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { ArrowUp, Calendar, GraduationCap, Heart, Leaf, Recycle, ShoppingBag, Smile, Sparkles, Star, X, Zap } from 'lucide-react';
import { AvatarInfoPet, ConvertSeconds, CreateLinkEvent, GetConfiguration, LocalizeText, SendMessageComposer } from '../../../../../api';
import { LayoutPetImageView, UserProfileIconView } from '../../../../../common';
import { useRoom, useSessionInfo } from '../../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignProgressBar from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';

interface InfoStandWidgetPetViewProps
{
    avatarInfo: AvatarInfoPet;
    onClose: () => void;
}

const StatRow: FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: number; max: number; color: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'yellow' }> = ({ icon: Icon, label, value, max, color }) =>
{
    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-paragraph-xs">
                <Icon className="size-3.5 shrink-0 text-text-soft-400" />
                <span className="text-text-sub-600">{ label }</span>
                <span className="ml-auto tabular-nums text-label-xs text-text-strong-950">{ value }/{ max }</span>
            </div>
            <AlignProgressBar.Root value={ pct } color={ color } className="h-1.5" />
        </div>
    );
};

const MetaRow: FC<{ icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }> = ({ icon: Icon, label, children }) =>
(
    <div className="flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
        <Icon className="size-3.5 shrink-0 text-text-soft-400" />
        <span className="text-text-sub-600">{ label }</span>
        <span className="ml-auto truncate text-label-xs text-text-strong-950">{ children }</span>
    </div>
);

export const InfoStandWidgetPetView: FC<InfoStandWidgetPetViewProps> = props =>
{
    const { avatarInfo = null, onClose = null } = props;
    const [ remainingGrowTime, setRemainingGrowTime ] = useState(0);
    const [ remainingTimeToLive, setRemainingTimeToLive ] = useState(0);
    const { roomSession = null } = useRoom();
    const { petRespectRemaining = 0, respectPet = null } = useSessionInfo();

    useEffect(() =>
    {
        if(!avatarInfo) return;
        setRemainingGrowTime(avatarInfo.remainingGrowTime);
        setRemainingTimeToLive(avatarInfo.remainingTimeToLive);
    }, [ avatarInfo ]);

    useEffect(() =>
    {
        if(!avatarInfo) return;
        if((avatarInfo.petType !== PetType.MONSTERPLANT) || avatarInfo.dead) return;

        const interval = setInterval(() =>
        {
            setRemainingGrowTime(prev => prev - 1);
            setRemainingTimeToLive(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [ avatarInfo ]);

    const wellbeingPct = useMemo(() =>
    {
        if(!avatarInfo) return 0;
        const max = avatarInfo.maximumTimeToLive;
        if(!max || max <= 0) return 0;
        const current = avatarInfo.dead ? 0 : (remainingTimeToLive || avatarInfo.remainingTimeToLive || 0);
        return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
    }, [ avatarInfo, remainingTimeToLive ]);

    const wellbeingColor: 'red' | 'orange' | 'green' = wellbeingPct < 30 ? 'red' : wellbeingPct < 60 ? 'orange' : 'green';

    const wellbeingTime = useMemo(() =>
    {
        if(!avatarInfo) return '00:00:00';
        if(avatarInfo.dead) return '00:00:00';
        const value = remainingTimeToLive ?? 0;
        const parts = ConvertSeconds(value).split(':');
        return `${ parts[1] ?? '00' }:${ parts[2] ?? '00' }:${ parts[3] ?? '00' }`;
    }, [ avatarInfo, remainingTimeToLive ]);

    if(!avatarInfo) return null;

    const isMonsterplant = avatarInfo.petType === PetType.MONSTERPLANT;
    const isOwner = avatarInfo.isOwner;

    const processButtonAction = (action: string) =>
    {
        let hideMenu = true;
        if(!action) return;

        switch(action)
        {
            case 'respect':
                respectPet(avatarInfo.id);
                if((petRespectRemaining - 1) >= 1) hideMenu = false;
                break;
            case 'buyfood':
                CreateLinkEvent('catalog/open/' + GetConfiguration('catalog.links')['pets.buy_food']);
                break;
            case 'train':
                roomSession?.requestPetCommands(avatarInfo.id);
                break;
            case 'treat':
                SendMessageComposer(new PetRespectComposer(avatarInfo.id));
                break;
            case 'compost':
                roomSession?.compostPlant(avatarInfo.id);
                break;
            case 'pick_up':
                roomSession?.pickupPet(avatarInfo.id);
                break;
        }

        if(hideMenu) onClose();
    };

    return (
        <AlignSurface.Panel className="!h-auto !min-w-[300px] !max-w-[300px] overflow-hidden !rounded-20 !border-0 !bg-bg-white-0 !text-text-strong-950">
            { /* Header */ }
            <div className="flex items-center gap-2 bg-bg-white-0 px-4 py-3">
                <div className="min-w-0 flex-1">
                    <div className="truncate text-label-md text-text-strong-950">{ avatarInfo.name }</div>
                    <div className="truncate text-paragraph-xs text-text-soft-400">{ LocalizeText(`pet.breed.${ avatarInfo.petType }.${ avatarInfo.petBreed }`) }</div>
                </div>
                <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ onClose }>
                    <AlignButton.Icon as={ X } className="size-4" />
                </AlignButton.Root>
            </div>

            <AlignDivider.Root />

            <div className="bg-bg-white-0 p-2.5 space-y-2.5">
                { /* Card 1: Pet image + Stats */ }
                <div className="rounded-2xl bg-bg-weak-50 p-2.5">
                    <div className="flex gap-3">
                        <div className="relative flex h-[104px] w-[82px] shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                            <LayoutPetImageView figure={ avatarInfo.petFigure } posture={ avatarInfo.posture } direction={ 4 } />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                                { !avatarInfo.dead && (
                                    <AlignBadge.Root color="blue" variant="lighter" size="small">
                                        Lv.{ avatarInfo.level }/{ avatarInfo.maximumLevel }
                                    </AlignBadge.Root>
                                ) }
                                { avatarInfo.dead && (
                                    <AlignBadge.Root color="red" variant="lighter" size="small">
                                        Tot
                                    </AlignBadge.Root>
                                ) }
                                { isMonsterplant && (
                                    <AlignBadge.Root color="green" variant="lighter" size="small">
                                        <AlignBadge.Icon as={ Leaf } className="size-3" />
                                        Pflanze
                                    </AlignBadge.Root>
                                ) }
                            </div>

                            { isMonsterplant ? (
                                <>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-paragraph-xs">
                                            <Sparkles className="size-3.5 shrink-0 text-text-soft-400" />
                                            <span className="text-text-sub-600">{ LocalizeText('infostand.pet.text.wellbeing') }</span>
                                            <span className="ml-auto tabular-nums text-label-xs text-text-strong-950">{ wellbeingTime }</span>
                                        </div>
                                        <AlignProgressBar.Root value={ wellbeingPct } color={ wellbeingColor } className="h-1.5" />
                                    </div>
                                    { remainingGrowTime > 0 && (
                                        <div className="flex items-center gap-1.5 rounded-xl bg-bg-white-0 px-2.5 py-1.5 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                                            <Calendar className="size-3.5 shrink-0 text-text-soft-400" />
                                            <span className="text-text-sub-600">{ LocalizeText('infostand.pet.text.growth') }</span>
                                            <span className="ml-auto tabular-nums text-label-xs text-text-strong-950">{ ConvertSeconds(remainingGrowTime).split(':').slice(1).join(':') }</span>
                                        </div>
                                    ) }
                                </>
                            ) : (
                                <>
                                    <StatRow icon={ Smile } label={ LocalizeText('infostand.pet.text.happiness') } value={ avatarInfo.happyness } max={ avatarInfo.maximumHappyness } color="blue" />
                                    <StatRow icon={ Star } label={ LocalizeText('infostand.pet.text.experience') } value={ avatarInfo.experience } max={ avatarInfo.levelExperienceGoal } color="purple" />
                                    <StatRow icon={ Zap } label={ LocalizeText('infostand.pet.text.energy') } value={ avatarInfo.energy } max={ avatarInfo.maximumEnergy } color="green" />
                                </>
                            ) }
                        </div>
                    </div>
                </div>

                { /* Card 2: Meta-Infos */ }
                <div className="rounded-2xl bg-bg-weak-50 p-2.5 space-y-1.5">
                    <div className="flex items-center gap-2 rounded-xl bg-bg-white-0 px-2.5 py-2 text-paragraph-xs shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                        <UserProfileIconView userId={ avatarInfo.ownerId } />
                        <span className="text-text-sub-600">Besitzer</span>
                        <span className="ml-auto truncate text-label-xs text-text-strong-950">{ avatarInfo.ownerName }</span>
                    </div>
                    <MetaRow icon={ Calendar } label="Alter">
                        { LocalizeText('pet.age', [ 'age' ], [ avatarInfo.age.toString() ]) }
                    </MetaRow>
                    { !isMonsterplant && (
                        <MetaRow icon={ Heart } label="Respekt">
                            { avatarInfo.respect.toString() }
                        </MetaRow>
                    ) }
                    { isMonsterplant && (
                        <MetaRow icon={ Sparkles } label={ LocalizeText('infostand.pet.text.raritylevel', [ 'level' ], [ '' ]).replace(':', '').trim() }>
                            { LocalizeText(`infostand.pet.raritylevel.${ avatarInfo.rarityLevel }`) }
                        </MetaRow>
                    ) }
                </div>
            </div>

            <AlignDivider.Root />

            { /* Footer Action Bar */ }
            <div className="flex flex-wrap items-center gap-1.5 bg-bg-white-0 p-2.5">
                { !isMonsterplant && (
                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="h-7 gap-1 text-[10px]" onClick={ () => processButtonAction('buyfood') }>
                        <AlignButton.Icon as={ ShoppingBag } className="size-3" />
                        { LocalizeText('infostand.button.buyfood') }
                    </AlignButton.Root>
                ) }
                { isOwner && !isMonsterplant && (
                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="h-7 gap-1 text-[10px]" onClick={ () => processButtonAction('train') }>
                        <AlignButton.Icon as={ GraduationCap } className="size-3" />
                        { LocalizeText('infostand.button.train') }
                    </AlignButton.Root>
                ) }
                { !avatarInfo.dead && isMonsterplant && ((avatarInfo.energy / avatarInfo.maximumEnergy) < 0.98) && (
                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="h-7 gap-1 text-[10px]" onClick={ () => processButtonAction('treat') }>
                        <AlignButton.Icon as={ Sparkles } className="size-3" />
                        { LocalizeText('infostand.button.pettreat') }
                    </AlignButton.Root>
                ) }
                { roomSession?.isRoomOwner && isMonsterplant && (
                    <AlignButton.Root variant="error" mode="stroke" size="xxsmall" className="h-7 gap-1 text-[10px]" onClick={ () => processButtonAction('compost') }>
                        <AlignButton.Icon as={ Recycle } className="size-3" />
                        { LocalizeText('infostand.button.compost') }
                    </AlignButton.Root>
                ) }
                { isOwner && (
                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="h-7 gap-1 text-[10px]" onClick={ () => processButtonAction('pick_up') }>
                        <AlignButton.Icon as={ ArrowUp } className="size-3" />
                        { LocalizeText('inventory.pets.pickup') }
                    </AlignButton.Root>
                ) }
                { (petRespectRemaining > 0) && !isMonsterplant && (
                    <AlignButton.Root variant="primary" mode="filled" size="xxsmall" className="ml-auto h-7 gap-1 text-[10px]" onClick={ () => processButtonAction('respect') }>
                        <AlignButton.Icon as={ Heart } className="size-3" />
                        { LocalizeText('infostand.button.petrespect', [ 'count' ], [ petRespectRemaining.toString() ]) }
                    </AlignButton.Root>
                ) }
            </div>
        </AlignSurface.Panel>
    );
};
