import { FC, useMemo } from 'react';
import { CatalogLayoutProps } from './CatalogLayout.types';

const parseContentBlocks = (html: string): { number?: string; html: string }[] =>
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
};

export const CatalogLayoutPets3View: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    const teaserImage = page.localization.getImage(1);
    const title = page.localization.getText(1);
    const intro = page.localization.getText(0);
    const content = page.localization.getText(2);
    const footer = page.localization.getText(3);

    const blocks = useMemo(() => parseContentBlocks(content), [ content ]);

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'none' } }>
            <div className="flex flex-col gap-3 p-3">

                { /* Hero: Image + Title */ }
                { (teaserImage || title) &&
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-weak-50 border border-stroke-soft-200">
                        { teaserImage &&
                            <img src={ teaserImage } alt="" className="w-16 h-16 object-contain shrink-0 rounded-lg" /> }
                        { title &&
                            <div className="catalog-page-text text-sm font-bold text-text-strong-950" dangerouslySetInnerHTML={ { __html: title } } /> }
                    </div> }
                { /* Intro text */ }
                { intro &&
                    <div className="catalog-page-text text-[11px] text-text-soft-400 leading-relaxed px-0.5" dangerouslySetInnerHTML={ { __html: intro } } /> }
                { /* Content blocks (numbered steps or paragraphs) */ }
                { blocks.length > 0
                    ? <div className="flex flex-col gap-2">
                        { blocks.map((block, i) =>
                            <div key={ i } className={ `flex gap-3 rounded-lg ${ block.number ? 'p-3 bg-bg-weak-50 border border-stroke-soft-200' : 'px-0.5' }` }>
                                { block.number &&
                                    <span className="text-lg font-bold text-sky-400/40 shrink-0 w-5 text-right leading-tight mt-px">
                                        { block.number }
                                    </span> }
                                <div className="catalog-page-text text-[11px] text-text-sub-600 leading-relaxed flex-1 min-w-0" dangerouslySetInnerHTML={ { __html: block.html } } />
                            </div>
                        ) }
                    </div>
                    : content
                        ? <div className="catalog-page-text text-[11px] text-text-sub-600 leading-relaxed" dangerouslySetInnerHTML={ { __html: content } } />
                        : null }
                { /* Footer hint */ }
                { footer &&
                    <div className="catalog-page-text text-[10px] text-text-disabled-300 italic mt-1 px-0.5" dangerouslySetInnerHTML={ { __html: footer } } /> }

            </div>
        </div>
    );
}
