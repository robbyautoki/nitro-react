import { FC } from 'react';
import { BadgeCent, Coins } from 'lucide-react';
import { LocalizeText } from '../../../../api';
import { Base } from '../../../../common';
import { useFurnitureExchangeWidget } from '../../../../hooks';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetActions, FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

export const FurnitureExchangeCreditView: FC<{}> = props =>
{
    const { objectId = -1, value = 0, onClose = null, redeem = null } = useFurnitureExchangeWidget();

    if(objectId === -1) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-exchange-credit"
            title={ LocalizeText('catalog.redeem.dialog.title') }
            subtitle={ LocalizeText('creditfurni.description', [ 'credits' ], [ value.toString() ]) }
            icon={ Coins }
            onClose={ onClose }
            widthClassName="w-[420px]"
            footer={
                <FurnitureWidgetActions>
                    <FancyButton.Root variant="primary" size="small" className="w-full" onClick={ redeem }>
                        <FancyButton.Icon as={ BadgeCent } />
                        { LocalizeText('catalog.redeem.dialog.button.exchange') }
                    </FancyButton.Root>
                </FurnitureWidgetActions>
            }
        >
            <FurnitureWidgetSection className="grid grid-cols-[112px_1fr] gap-4">
                <FurnitureWidgetPreview className="size-28">
                    <Base className="exchange-image" />
                </FurnitureWidgetPreview>
                <div className="flex min-w-0 flex-col justify-center gap-2">
                    <div className="text-label-sm text-text-strong-950">{ LocalizeText('creditfurni.description', [ 'credits' ], [ value.toString() ]) }</div>
                    <FurnitureWidgetText>{ LocalizeText('creditfurni.prompt') }</FurnitureWidgetText>
                </div>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    );
}
