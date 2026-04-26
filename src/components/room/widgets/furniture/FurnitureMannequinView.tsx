import { HabboClubLevelEnum, RoomControllerLevel } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Save, Shirt, Undo2, UserCheck } from 'lucide-react';
import { GetAvatarRenderManager, GetClubMemberLevel, GetRoomSession, GetSessionDataManager, LocalizeText, MannequinUtilities } from '../../../../api';
import { Base, LayoutAvatarImageView, LayoutCurrencyIcon } from '../../../../common';
import { useFurnitureMannequinWidget } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

const MODE_NONE: number = -1;
const MODE_CONTROLLER: number = 0;
const MODE_UPDATE: number = 1;
const MODE_PEER: number = 2;
const MODE_NO_CLUB: number = 3;
const MODE_WRONG_GENDER: number = 4;

export const FurnitureMannequinView: FC<{}> = props =>
{
    const [ renderedFigure, setRenderedFigure ] = useState<string>(null);
    const [ mode, setMode ] = useState(MODE_NONE);
    const { objectId = -1, figure = null, gender = null, clubLevel = HabboClubLevelEnum.NO_CLUB, name = null, setName = null, saveFigure = null, wearFigure = null, saveName = null, onClose = null } = useFurnitureMannequinWidget();

    useEffect(() =>
    {
        if(objectId === -1) return;

        const roomSession = GetRoomSession();

        if(roomSession.isRoomOwner || (roomSession.controllerLevel >= RoomControllerLevel.GUEST) || GetSessionDataManager().isModerator)
        {
            setMode(MODE_CONTROLLER);

            return;
        }
        
        if(GetSessionDataManager().gender.toLowerCase() !== gender.toLowerCase())
        {
            setMode(MODE_WRONG_GENDER);

            return;
        }

        if(GetClubMemberLevel() < clubLevel)
        {
            setMode(MODE_NO_CLUB);

            return;
        }
        
        setMode(MODE_PEER);
    }, [ objectId, gender, clubLevel ]);

    useEffect(() =>
    {
        switch(mode)
        {
            case MODE_CONTROLLER:
            case MODE_WRONG_GENDER: {
                const figureContainer = GetAvatarRenderManager().createFigureContainer(figure);

                MannequinUtilities.transformAsMannequinFigure(figureContainer);

                setRenderedFigure(figureContainer.getFigureString());
                break;
            }
            case MODE_UPDATE: {
                const figureContainer = GetAvatarRenderManager().createFigureContainer(GetSessionDataManager().figure);

                MannequinUtilities.transformAsMannequinFigure(figureContainer);

                setRenderedFigure(figureContainer.getFigureString());
                break;
            }
            case MODE_PEER:
            case MODE_NO_CLUB: {
                const figureContainer = MannequinUtilities.getMergedMannequinFigureContainer(GetSessionDataManager().figure, figure);

                setRenderedFigure(figureContainer.getFigureString());
                break;
            }
        }
    }, [ mode, figure, clubLevel ]);

    if(objectId === -1) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-mannequin"
            title={ LocalizeText('mannequin.widget.title') }
            subtitle={ name }
            icon={ Shirt }
            onClose={ onClose }
            widthClassName="w-[420px]"
        >
            <FurnitureWidgetSection className="grid grid-cols-[112px_1fr] gap-4">
                <FurnitureWidgetPreview className="min-h-[156px]">
                    <Base position="relative" className="mannequin-preview">
                        <LayoutAvatarImageView position="absolute" figure={ renderedFigure } direction={ 2 } />
                        { (clubLevel > 0) &&
                            <LayoutCurrencyIcon className="absolute bottom-2 right-2" type="hc" /> }
                    </Base>
                </FurnitureWidgetPreview>
                <div className="flex min-w-0 flex-col justify-between gap-3">
                    { (clubLevel > 0) &&
                        <AlignBadge.Root color="yellow" variant="light" size="small" className="w-fit">HC</AlignBadge.Root> }
                    { (mode === MODE_CONTROLLER) &&
                        <>
                            <AlignInput.Root>
                                <AlignInput.Wrapper>
                                    <AlignInput.Input value={ name || '' } onChange={ event => setName(event.target.value) } onBlur={ saveName } />
                                </AlignInput.Wrapper>
                            </AlignInput.Root>
                            <div className="grid gap-2">
                                <FancyButton.Root variant="primary" size="small" onClick={ event => setMode(MODE_UPDATE) }>
                                    <FancyButton.Icon as={ Save } />
                                    { LocalizeText('mannequin.widget.style') }
                                </FancyButton.Root>
                                <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ wearFigure }>
                                    <AlignButton.Icon as={ UserCheck } className="size-4" />
                                    { LocalizeText('mannequin.widget.wear') }
                                </AlignButton.Root>
                            </div>
                        </> }
                    { (mode === MODE_UPDATE) &&
                        <>
                            <div className="space-y-2">
                                <div className="text-label-sm text-text-strong-950">{ name }</div>
                                <FurnitureWidgetText>{ LocalizeText('mannequin.widget.savetext') }</FurnitureWidgetText>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ event => setMode(MODE_CONTROLLER) }>
                                    <AlignButton.Icon as={ Undo2 } className="size-4" />
                                    { LocalizeText('mannequin.widget.back') }
                                </AlignButton.Root>
                                <FancyButton.Root variant="primary" size="small" onClick={ saveFigure }>
                                    <FancyButton.Icon as={ Save } />
                                    { LocalizeText('mannequin.widget.save') }
                                </FancyButton.Root>
                            </div>
                        </> }
                    { (mode === MODE_PEER) &&
                        <>
                            <div className="space-y-2">
                                <div className="text-label-sm text-text-strong-950">{ name }</div>
                                <FurnitureWidgetText>{ LocalizeText('mannequin.widget.weartext') }</FurnitureWidgetText>
                            </div>
                            <FancyButton.Root variant="primary" size="small" onClick={ wearFigure }>
                                <FancyButton.Icon as={ UserCheck } />
                                { LocalizeText('mannequin.widget.wear') }
                            </FancyButton.Root>
                        </> }
                    { (mode === MODE_NO_CLUB) &&
                        <FurnitureWidgetText className="self-center text-text-strong-950">{ LocalizeText('mannequin.widget.clubnotification') }</FurnitureWidgetText> }
                    { (mode === MODE_WRONG_GENDER) &&
                        <FurnitureWidgetText className="self-center text-text-strong-950">{ LocalizeText('mannequin.widget.wronggender') }</FurnitureWidgetText> }
                </div>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    );
}
