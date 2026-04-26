import { ReactNode } from 'react';
import * as AlignModal from '@/align-ui/components/ui/modal';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

interface AlignGameConfirmProps
{
    open: boolean;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function AlignGameConfirm({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Abbrechen',
    destructive = false,
    onConfirm,
    onCancel,
}: AlignGameConfirmProps)
{
    return (
        <AlignModal.Root open={ open } onOpenChange={ isOpen =>
        {
            if(!isOpen) onCancel();
        } }>
            <AlignModal.Content className="z-[901] max-w-[340px]" overlayClassName="z-[900]" showClose={ false }>
                <AlignModal.Header className="pr-5">
                    <div className="space-y-1">
                        <AlignModal.Title>{ title }</AlignModal.Title>
                        <AlignModal.Description asChild>
                            <div>{ description }</div>
                        </AlignModal.Description>
                    </div>
                </AlignModal.Header>
                <AlignModal.Footer>
                    <FancyButton.Root type="button" variant="basic" size="small" className="flex-1" onClick={ onCancel }>
                        { cancelLabel }
                    </FancyButton.Root>
                    <FancyButton.Root type="button" variant={ destructive ? 'destructive' : 'primary' } size="small" className="flex-1" onClick={ onConfirm }>
                        { confirmLabel }
                    </FancyButton.Root>
                </AlignModal.Footer>
            </AlignModal.Content>
        </AlignModal.Root>
    );
}
