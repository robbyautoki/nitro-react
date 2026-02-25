import { FC, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { useCatalog } from '../../../../../hooks';
import { CatalogLayoutProps } from './CatalogLayout.types';

function parseContentBlocks(html: string): { number?: string; html: string }[]
{
    if(!html?.trim()) return [];
    const normalized = html.replace(/<br\s*\/?>/gi, '\n');
    const chunks = normalized.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    return chunks.map(chunk =>
    {
        const rendered = chunk.replace(/\n/g, '<br>');
        const match = chunk.match(/^(\d+)\.\s*/);
        if(match) return { number: match[1], html: rendered.replace(/^\d+\.\s*/, '') };
        return { html: rendered };
    });
}

export const CatalogLayoutInfoLoyaltyView: FC<CatalogLayoutProps> = props =>
{
    const { currentPage = null } = useCatalog();

    const pageText1 = useMemo(() => currentPage?.localization?.getText(0) || '', [ currentPage ]);
    const pageText2 = useMemo(() => currentPage?.localization?.getText(1) || '', [ currentPage ]);
    const headline = useMemo(() => currentPage?.localization?.getImage(0) || '', [ currentPage ]);
    const teaser = useMemo(() => currentPage?.localization?.getImage(1) || '', [ currentPage ]);
    const blocks = useMemo(() => parseContentBlocks(pageText1), [ pageText1 ]);
    const numberedBlocks = blocks.filter(b => b.number);
    const textBlocks = blocks.filter(b => !b.number);
    const hasImages = headline || teaser;
    const caption = currentPage?.localization ? (currentPage as any).localization?.getText?.(2) || '' : '';

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            {/* Hero Card */}
            { hasImages && (
                <div className="shrink-0 relative overflow-hidden border-b border-border/30">
                    <div className="relative flex items-center gap-4 p-5 bg-gradient-to-r from-primary/[0.04] via-transparent to-transparent">
                        <div className="shrink-0 flex items-center gap-3">
                            { headline && <img src={ headline } alt="" className="h-14 object-contain rounded-lg drop-shadow-sm" onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } } /> }
                            { teaser && teaser !== headline && <img src={ teaser } alt="" className="h-14 object-contain rounded-lg drop-shadow-sm" onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } } /> }
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-black tracking-tight">{ currentPage?.localization?.getText?.(2) || 'Info' }</h2>
                        </div>
                    </div>
                </div>
            ) }

            {/* Content */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                { pageText2 && (
                    <div className="rounded-xl border border-border/40 bg-card p-4">
                        <div className="text-sm font-medium text-foreground/80 leading-relaxed catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText2 } } />
                    </div>
                ) }

                { numberedBlocks.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-card p-4">
                        <h3 className="text-sm font-bold mb-3">Anleitung</h3>
                        <div className="flex flex-col gap-3">
                            { numberedBlocks.map((block, i) => (
                                <div key={ i } className="flex gap-3 items-start">
                                    <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                                        { block.number }
                                    </div>
                                    <div className="flex-1 min-w-0 text-sm text-muted-foreground leading-relaxed pt-1 catalog-page-text" dangerouslySetInnerHTML={ { __html: block.html } } />
                                </div>
                            )) }
                        </div>
                    </div>
                ) }

                { textBlocks.length > 0 && (
                    <div className="rounded-xl border border-border/40 bg-card p-4">
                        <div className="space-y-2">
                            { textBlocks.map((block, i) => (
                                <div key={ i } className="text-sm text-muted-foreground leading-relaxed catalog-page-text" dangerouslySetInnerHTML={ { __html: block.html } } />
                            )) }
                        </div>
                    </div>
                ) }

                { blocks.length === 0 && pageText1 ? (
                    <div className="rounded-xl border border-border/40 bg-card p-4">
                        <div className="text-sm text-muted-foreground leading-relaxed catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText1 } } />
                    </div>
                ) : blocks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <FileText className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium">Keine Inhalte auf dieser Seite</p>
                    </div>
                ) }
            </div>
        </div>
    );
}
