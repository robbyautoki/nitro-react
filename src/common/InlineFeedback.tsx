import { FC } from 'react';
import { AlertTriangle, Check, Loader2, X } from 'lucide-react';

export type InlineFeedbackTone = 'success' | 'error' | 'info' | 'pending';

export interface InlineFeedbackProps
{
    tone: InlineFeedbackTone;
    message: string;
    onDismiss?: () => void;
    className?: string;
}

const TONE_STYLES: Record<InlineFeedbackTone, { container: string; text: string; icon: JSX.Element }> = {
    success: {
        container: 'border-success-base/30 bg-success-lighter',
        text: 'text-success-base',
        icon: <Check className="size-3.5 shrink-0" />,
    },
    error: {
        container: 'border-error-base/30 bg-error-lighter',
        text: 'text-error-base',
        icon: <AlertTriangle className="size-3.5 shrink-0" />,
    },
    info: {
        container: 'border-information-base/30 bg-information-lighter',
        text: 'text-information-base',
        icon: <Check className="size-3.5 shrink-0" />,
    },
    pending: {
        container: 'border-stroke-soft-200 bg-bg-weak-50',
        text: 'text-text-sub-600',
        icon: <Loader2 className="size-3.5 shrink-0 animate-spin" />,
    },
};

/**
 * Standard inline feedback banner used inside panels for live action results
 * (purchase succeeded, reward claimed, repair completed, etc.).
 *
 * Position via wrapper (e.g. mx-4 mt-3) — this component owns colour, icon
 * and dismiss button only.
 */
export const InlineFeedback: FC<InlineFeedbackProps> = ({ tone, message, onDismiss, className }) =>
{
    const t = TONE_STYLES[tone];
    return (
        <div className={ `flex items-center gap-2 rounded-xl border px-3 py-2 text-paragraph-xs ${ t.container } ${ t.text } ${ className ?? '' }` }>
            { t.icon }
            <span className="flex-1">{ message }</span>
            { onDismiss && (
                <button
                    type="button"
                    onClick={ onDismiss }
                    className="opacity-60 transition-opacity hover:opacity-100"
                    aria-label="Schließen"
                >
                    <X className="size-3" />
                </button>
            ) }
        </div>
    );
};
