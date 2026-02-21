import { FC, useState } from 'react';
import { ReportState, ReportType } from '../../../api';
import { useHelp } from '../../../hooks';

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
            <div>
                <p className="text-xs text-white/40 mb-3">Beschreibe das Problem moeglichst genau (min. 15 Zeichen)</p>
            </div>

            <div className="relative">
                <textarea
                    className="w-full h-32 px-3.5 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white/90 placeholder-white/25 resize-none focus:outline-none focus:border-white/[0.15] focus:ring-1 focus:ring-white/[0.08] transition-all"
                    placeholder="Was ist passiert?"
                    value={ message }
                    onChange={ e => setMessage(e.target.value) }
                />
                <div className={ `absolute bottom-3 right-3 text-[11px] ${ isValid ? 'text-green-400/60' : 'text-white/25' }` }>
                    { charCount }/15
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={ !isValid }
                    onClick={ submitMessage }
                >
                    Weiter
                </button>
            </div>
        </div>
    );
};
