import { FC } from 'react';
import { Check, HeartHandshake, LockKeyhole, X } from 'lucide-react';
import { LocalizeText } from '../../../../api';
import { LayoutAvatarImageView } from '../../../../common';
import { useFurnitureFriendFurniWidget } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetActions, FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

export const FurnitureFriendFurniView: FC<{}> = props =>
{
    const { objectId = -1, type = 0, stage = 0, usernames = [], figures = [], date = null, onClose = null, respond = null } = useFurnitureFriendFurniWidget();

    if(objectId === -1) return null;

    if(stage > 0)
    {
        return (
            <FurnitureWidgetWindow
                uniqueKey="friend-furni-confirm"
                title={ LocalizeText('friend.furniture.confirm.lock.caption') }
                subtitle={ LocalizeText('friend.furniture.confirm.lock.subtitle') }
                icon={ LockKeyhole }
                onClose={ onClose }
                widthClassName="w-[360px]"
                footer={
                    <FurnitureWidgetActions className="grid grid-cols-2">
                        <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ event => respond(false) }>
                            <AlignButton.Icon as={ X } className="size-4" />
                            { LocalizeText('friend.furniture.confirm.lock.button.cancel') }
                        </AlignButton.Root>
                        <FancyButton.Root variant="primary" size="small" onClick={ event => respond(true) }>
                            <FancyButton.Icon as={ Check } />
                            { LocalizeText('friend.furniture.confirm.lock.button.confirm') }
                        </FancyButton.Root>
                    </FurnitureWidgetActions>
                }
            >
                <FurnitureWidgetSection className="flex flex-col items-center gap-3 text-center">
                    <FurnitureWidgetPreview className="size-20">
                        <div className={ `engraving-lock-stage-${ stage }` } />
                    </FurnitureWidgetPreview>
                    <div className="text-label-sm text-text-strong-950">{ LocalizeText('friend.furniture.confirm.lock.subtitle') }</div>
                    { (stage === 2) &&
                        <FurnitureWidgetText>{ LocalizeText('friend.furniture.confirm.lock.other.locked') }</FurnitureWidgetText> }
                </FurnitureWidgetSection>
            </FurnitureWidgetWindow>
        );
    }

    if(usernames.length > 0)
    {
        return (
            <FurnitureWidgetWindow
                uniqueKey="friend-furni-view"
                title={ (type === 3) ? LocalizeText('wildwest.engraving.caption') : LocalizeText('lovelock.engraving.caption') }
                subtitle={ date }
                icon={ HeartHandshake }
                onClose={ onClose }
                widthClassName="w-[400px]"
            >
                <FurnitureWidgetSection className="space-y-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <FurnitureWidgetPreview className="h-32">
                            <LayoutAvatarImageView figure={ figures[0] } direction={ 2 } />
                        </FurnitureWidgetPreview>
                        <HeartHandshake className="size-5 text-primary-base" />
                        <FurnitureWidgetPreview className="h-32">
                            <LayoutAvatarImageView figure={ figures[1] } direction={ 4 } />
                        </FurnitureWidgetPreview>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <AlignBadge.Root color="pink" variant="light" size="medium">{ usernames[0] }</AlignBadge.Root>
                        <AlignBadge.Root color="pink" variant="light" size="medium">{ usernames[1] }</AlignBadge.Root>
                    </div>
                </FurnitureWidgetSection>
            </FurnitureWidgetWindow>
        );
    }

    return null;
}
