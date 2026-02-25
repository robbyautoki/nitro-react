import { FC, useMemo } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { Button } from '../../../../ui/button';
import { useCatalog } from '../../../../../hooks';
import { CatalogLayoutProps } from './CatalogLayout.types';
import { CatalogGuildSelectorWidgetView } from '../widgets/CatalogGuildSelectorWidgetView';

export const CatalogLayoutGuildForumView: FC<CatalogLayoutProps> = props =>
{
    const { currentPage = null } = useCatalog();
    const pageText = useMemo(() => currentPage?.localization?.getText(0) || '', [ currentPage ]);

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 gap-3" style={ { scrollbarWidth: 'thin' } }>
            <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary/60" />
                <span className="text-sm font-bold">Gruppen-Forum</span>
            </div>
            { pageText && (
                <div className="rounded-lg bg-muted/10 border border-border/30 p-4 text-xs text-muted-foreground leading-relaxed catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText } } />
            ) }
            <div className="rounded-lg border border-border/40 bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-muted-foreground/50" />
                    <span className="text-xs font-semibold">Gruppe auswählen</span>
                </div>
                <CatalogGuildSelectorWidgetView />
                <Button className="w-full h-9 mt-3 gap-2 rounded-lg text-xs font-bold" disabled>
                    <MessageSquare className="w-3.5 h-3.5" /> Forum aktivieren
                </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center">Forum-Verwaltung im Spiel verfügbar</p>
        </div>
    );
}
