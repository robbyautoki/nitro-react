import { CancelMysteryBoxWaitMessageEvent, GotMysteryBoxPrizeMessageEvent, MysteryBoxWaitingCanceledMessageComposer, ShowMysteryBoxWaitMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { PackageOpen, Sparkles, X } from 'lucide-react';
import { GetSessionDataManager, LocalizeText, SendMessageComposer } from '../../../../api';
import { LayoutPrizeProductImageView } from '../../../../common/layout/LayoutPrizeProductImageView';
import { useMessageEvent } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetActions, FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

interface FurnitureMysteryBoxOpenDialogViewProps
{
    ownerId: number;
}

type PrizeData = {
    contentType:string;
    classId:number;
}

enum ViewMode {
    HIDDEN,
    WAITING,
    PRIZE
}

export const FurnitureMysteryBoxOpenDialogView: FC<FurnitureMysteryBoxOpenDialogViewProps> = props =>
{
    const { ownerId = -1 } = props;
    const [ mode, setMode ] = useState<ViewMode>(ViewMode.HIDDEN);
    const [ prizeData, setPrizeData ] = useState<PrizeData>(undefined);

    const close = () =>
    {
        if(mode === ViewMode.WAITING) SendMessageComposer(new MysteryBoxWaitingCanceledMessageComposer(ownerId));
        setMode(ViewMode.HIDDEN);
        setPrizeData(undefined);
    }

    useMessageEvent<ShowMysteryBoxWaitMessageEvent>(ShowMysteryBoxWaitMessageEvent, event =>
    {
        setMode(ViewMode.WAITING);
    });

    useMessageEvent<CancelMysteryBoxWaitMessageEvent>(CancelMysteryBoxWaitMessageEvent, event =>
    {
        setMode(ViewMode.HIDDEN);
        setPrizeData(undefined);
    });

    useMessageEvent<GotMysteryBoxPrizeMessageEvent>(GotMysteryBoxPrizeMessageEvent, event =>
    {
        const parser = event.getParser();
        setPrizeData({ contentType: parser.contentType, classId: parser.classId });
        setMode(ViewMode.PRIZE);
    });

    const isOwner = GetSessionDataManager().userId === ownerId;

    if(mode === ViewMode.HIDDEN) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-mystery-box"
            title={ mode === ViewMode.WAITING ? LocalizeText(`mysterybox.dialog.${ isOwner ? 'owner' : 'other' }.title`) : LocalizeText('mysterybox.reward.title') }
            subtitle={ mode === ViewMode.WAITING ? LocalizeText(`mysterybox.dialog.${ isOwner ? 'owner' : 'other' }.waiting`) : LocalizeText('mysterybox.reward.text') }
            icon={ PackageOpen }
            onClose={ close }
            widthClassName="w-[390px]"
            footer={
                mode === ViewMode.WAITING ? (
                    <FurnitureWidgetActions>
                        <AlignButton.Root variant="error" mode="stroke" size="small" className="w-full" onClick={ close }>
                            <AlignButton.Icon as={ X } className="size-4" />
                            { LocalizeText(`mysterybox.dialog.${ isOwner ? 'owner' : 'other' }.cancel`) }
                        </AlignButton.Root>
                    </FurnitureWidgetActions>
                ) : (
                    <FurnitureWidgetActions>
                        <FancyButton.Root variant="primary" size="small" className="w-full" onClick={ close }>
                            <FancyButton.Icon as={ Sparkles } />
                            { LocalizeText('mysterybox.reward.close') }
                        </FancyButton.Root>
                    </FurnitureWidgetActions>
                )
            }
        >
            { mode === ViewMode.WAITING &&
                <FurnitureWidgetSection className="space-y-3">
                    <div className="text-label-sm text-primary-base">{ LocalizeText(`mysterybox.dialog.${ isOwner ? 'owner' : 'other' }.subtitle`) }</div>
                    <FurnitureWidgetText>{ LocalizeText(`mysterybox.dialog.${ isOwner ? 'owner' : 'other' }.description`) }</FurnitureWidgetText>
                    <FurnitureWidgetText className="text-text-strong-950">{ LocalizeText(`mysterybox.dialog.${ isOwner ? 'owner' : 'other' }.waiting`) }</FurnitureWidgetText>
                </FurnitureWidgetSection> }
            { mode === ViewMode.PRIZE && prizeData &&
                <FurnitureWidgetSection className="space-y-4 text-center">
                    <FurnitureWidgetText className="text-text-strong-950">{ LocalizeText('mysterybox.reward.text') }</FurnitureWidgetText>
                    <FurnitureWidgetPreview className="mx-auto size-28">
                        <div className="prize-container flex items-center justify-center">
                            <LayoutPrizeProductImageView classId={ prizeData.classId } productType={ prizeData.contentType } />
                        </div>
                    </FurnitureWidgetPreview>
                </FurnitureWidgetSection> }
        </FurnitureWidgetWindow>
    );
}
