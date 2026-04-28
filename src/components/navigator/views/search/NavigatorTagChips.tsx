import { FC } from 'react';
import * as AlignTag from '@/align-ui/components/ui/tag';

const QUICK_TAGS: { value: string; label: string }[] = [
    { value: 'rp',         label: 'RP' },
    { value: 'casino',     label: 'Casino' },
    { value: 'event',      label: 'Event' },
    { value: 'chill',      label: 'Chill' },
    { value: 'shop',       label: 'Shop' },
    { value: 'wired',      label: 'Wired' },
    { value: 'verlosung',  label: 'Verlosung' },
];

interface Props
{
    activeTag: string | null;
    onSelect: (tag: string | null) => void;
    className?: string;
}

export const NavigatorTagChips: FC<Props> = ({ activeTag, onSelect, className }) =>
{
    return (
        <div className={ '-mx-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap px-1 nav-no-scrollbar ' + (className ?? '') }>
            <AlignTag.Root variant={ activeTag === null ? 'primary' : 'gray' } className="!h-5 shrink-0 !px-2 !text-[10px]" asChild>
                <button type="button" onClick={ () => onSelect(null) }>
                    Alle
                </button>
            </AlignTag.Root>
            { QUICK_TAGS.map(tag =>
            {
                const isActive = activeTag === tag.value;
                return (
                    <AlignTag.Root
                        key={ tag.value }
                        variant={ isActive ? 'primary' : 'stroke' }
                        className="!h-5 shrink-0 !px-2 !text-[10px]"
                        asChild
                    >
                        <button type="button" onClick={ () => onSelect(isActive ? null : tag.value) }>
                            <span className="text-text-soft-400">#</span>
                            { tag.label }
                        </button>
                    </AlignTag.Root>
                );
            }) }
        </div>
    );
};
