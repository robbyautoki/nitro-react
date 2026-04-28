import { FC, PropsWithChildren } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';

export interface WiredConditionBaseViewProps
{
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
}

export const WiredConditionBaseView: FC<PropsWithChildren<WiredConditionBaseViewProps>> = props =>
{
    const { requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE, save = null, hasSpecialInput = false, children = null } = props;
    
    const onSave = () => (save && save());

    return (
        <WiredBaseView wiredType="condition" requiresFurni={ requiresFurni } hasSpecialInput={ hasSpecialInput } save={ onSave }>
            { !!children && (
                <div className="rounded-xl bg-bg-white-0 p-3 ring-1 ring-inset ring-stroke-soft-200">
                    { children }
                </div>
            ) }
        </WiredBaseView>
    );
}
