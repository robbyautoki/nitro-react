import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallbackView } from './ErrorFallbackView';
import { reportClientError } from './report-client-error';

interface ErrorBoundaryProps
{
    children: ReactNode;
    /** Auto-Reload-Countdown in Sekunden (0 = aus). Default: 30. */
    autoReloadSeconds?: number;
}

interface ErrorBoundaryState
{
    error: Error | null;
    info: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState>
{
    constructor(props: ErrorBoundaryProps)
    {
        super(props);
        this.state = { error: null, info: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState>
    {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void
    {
        // Console für lokale Debugging
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary]', error, info);

        this.setState({ info: info?.componentStack ?? null });

        // Best-effort logging an CMS — fail-soft
        reportClientError({
            kind: 'react',
            message: error?.message ?? 'Unbekannter Render-Fehler',
            stack: error?.stack ?? null,
            componentStack: info?.componentStack ?? null,
        });
    }

    render(): ReactNode
    {
        const { error, info } = this.state;
        const { autoReloadSeconds = 30, children } = this.props;

        if(error)
        {
            return <ErrorFallbackView error={ error } info={ info } autoReloadSeconds={ autoReloadSeconds } />;
        }

        return children;
    }
}
