import { FC } from 'react';
import { GetSessionDataManager, LocalizeText } from '../../../../api';
import { NameChangeLayoutViewProps } from './NameChangeView.types';
import * as AlignButton from '@/align-ui/components/ui/button';

export const NameChangeInitView:FC<NameChangeLayoutViewProps> = props =>
{
    const { onAction = null } = props;

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="rounded-xl bg-bg-weak-50 p-3 text-center text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                { LocalizeText('tutorial.name_change.info.main') }
            </div>
            <div className="flex min-h-20 items-center justify-center rounded-xl bg-bg-white-0 p-3 text-center text-label-sm text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                { LocalizeText('tutorial.name_change.current', [ 'name' ], [ GetSessionDataManager().userName ]) }
            </div>
            <div className="grid grid-cols-2 gap-2">
                <AlignButton.Root type="button" variant="primary" mode="filled" size="small" onClick={ () => onAction('start') }>
                    { LocalizeText('tutorial.name_change.change') }
                </AlignButton.Root>
                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" onClick={ () => onAction('confirmation', GetSessionDataManager().userName) }>
                    { LocalizeText('tutorial.name_change.keep') }
                </AlignButton.Root>
            </div>
        </div>
    );
}
