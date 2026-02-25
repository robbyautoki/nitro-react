import { FC, useMemo } from 'react';
import { Users } from 'lucide-react';
import { GetConfiguration } from '../../../../../api';
import { Button } from '../../../../ui/button';
import { useCatalog } from '../../../../../hooks';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutGuildFrontpageView: FC<CatalogLayoutProps> = props =>
{
    const { currentPage = null } = useCatalog();
    const imageLibUrl = useMemo(() => GetConfiguration<string>('image.library.url', ''), []);

    const pageText = useMemo(() => currentPage?.localization?.getText(0) || '', [ currentPage ]);
    const teaser = useMemo(() =>
    {
        const img = currentPage?.localization?.getImage(1);
        return img ? `${ imageLibUrl }${ img }` : '';
    }, [ currentPage, imageLibUrl ]);

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 gap-3" style={ { scrollbarWidth: 'thin' } }>
            { teaser && (
                <div className="flex justify-center p-4 rounded-xl bg-muted/20 border border-border/40">
                    <img src={ teaser } alt="" className="max-h-20 object-contain rounded-lg" onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } } />
                </div>
            ) }
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary/60" />
                <span className="text-sm font-bold">Gruppen</span>
            </div>
            { pageText && (
                <div className="rounded-lg bg-muted/10 border border-border/30 p-4 text-xs text-muted-foreground leading-relaxed catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText } } />
            ) }
            <Button className="w-full h-10 gap-2 rounded-xl text-sm font-bold" disabled>
                <Users className="w-4 h-4" /> Gruppe erstellen
            </Button>
            <p className="text-[10px] text-muted-foreground/50 text-center">Gruppenerstellung im Spiel verfügbar</p>
        </div>
    );
}
