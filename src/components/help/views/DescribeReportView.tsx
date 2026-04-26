import { FC, useState } from 'react';
import { ReportState } from '../../../api';
import { useHelp } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignTextarea from '@/align-ui/components/ui/textarea';
import { cn } from '@/align-ui/utils/cn';

export const DescribeReportView: FC<{}> = () =>
{
    const [ message, setMessage ] = useState('');
    const { activeReport = null, setActiveReport = null } = useHelp();

    const submitMessage = () =>
    {
        if(message.length < 15) return;

        setActiveReport(prev => ({
            ...prev,
            message,
            currentStep: ReportState.REPORT_SUMMARY,
        }));
    };

    const charCount = message.length;
    const isValid = charCount >= 15;

    return (
        <div className="space-y-4">
            <label className="block space-y-2">
                <span className="text-paragraph-xs text-text-sub-600">Beschreibe das Problem moeglichst genau (min. 15 Zeichen)</span>
                <AlignTextarea.Root
                    rows={ 5 }
                    className="min-h-32"
                    hasError={ charCount > 0 && !isValid }
                    placeholder="Was ist passiert?"
                    value={ message }
                    onChange={ e => setMessage(e.target.value) }
                >
                    <span className={ cn('text-subheading-2xs', isValid ? 'text-success-base' : 'text-text-soft-400') }>
                        { charCount }/15
                    </span>
                </AlignTextarea.Root>
            </label>
            <div className="flex justify-end pt-2">
                <AlignButton.Root
                    type="button"
                    variant="primary"
                    mode="filled"
                    size="small"
                    disabled={ !isValid }
                    onClick={ submitMessage }
                >
                    Weiter
                </AlignButton.Root>
            </div>
        </div>
    );
};
