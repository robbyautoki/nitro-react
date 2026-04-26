import { FC, useEffect, useState } from 'react';
import { LocalizeText, NotificationAlertItem, OpenUrl } from '../../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import * as AlignInput from '@/align-ui/components/ui/input';
import { RiArrowRightSLine, RiCloseLine, RiSearch2Line, RiSearchEyeLine } from '@remixicon/react';

interface NotificationSearchAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

const safeLocalize = (key: string, fallback: string): string =>
{
    const value = LocalizeText(key);
    return (!value || value === key) ? fallback : value;
};

export const NotificationSeachAlertView: FC<NotificationSearchAlertViewProps> = props =>
{
    const { item = null, onClose = null } = props;

    const title = (item.title && item.title.length > 0) ? item.title : safeLocalize('notifications.search.subtitle', 'Suche');
    const eyebrow = safeLocalize('notifications.search.eyebrow', 'Suche · Ergebnisse');

    const [ searchValue, setSearchValue ] = useState('');
    const [ results, setResults ] = useState<string[]>([]);

    const visitUrl = () =>
    {
        OpenUrl(item.clickUrl);
        onClose();
    };

    const updateSearchValue = (value: string) =>
    {
        try
        {
            const all = JSON.parse(item.messages[0]);
            setResults(all.filter((val: string) => val.toLowerCase().includes(value.toLowerCase())));
        }
        catch
        {
            setResults([]);
        }
        setSearchValue(value);
    };

    useEffect(() =>
    {
        try { setResults(JSON.parse(item.messages[0])); }
        catch { setResults([]); }
    }, [ item ]);

    const getInitial = (text: string) =>
    {
        const trimmed = (text || '').trim();
        return trimmed.length > 0 ? trimmed[0].toUpperCase() : '?';
    };

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[460px]">
                <div className="overflow-hidden rounded-20 bg-bg-white-0 shadow-regular-md">
                    <div className="drag-handler relative flex cursor-move select-none flex-col gap-1.5 px-5 pb-4 pt-5 pr-14 before:absolute before:inset-x-0 before:bottom-0 before:border-b before:border-stroke-soft-200">
                        <div className="flex items-center gap-1.5 text-subheading-2xs uppercase tracking-wider text-text-sub-600">
                            <RiSearch2Line className="size-3.5 shrink-0" />
                            <span>{ eyebrow }</span>
                        </div>
                        <div className="text-title-h6 font-medium leading-snug text-text-strong-950">{ title }</div>
                        <AlignCompactButton.Root
                            variant="ghost"
                            size="large"
                            className="absolute right-4 top-4"
                            onClick={ onClose }
                            onMouseDown={ (e) => e.stopPropagation() }
                        >
                            <AlignCompactButton.Icon as={ RiCloseLine } />
                        </AlignCompactButton.Root>
                    </div>
                    <div className="space-y-3 px-5 py-5">
                        <AlignInput.Root size="medium">
                            <AlignInput.Wrapper>
                                <AlignInput.Icon as={ RiSearch2Line } />
                                <AlignInput.Input
                                    placeholder={ LocalizeText('generic.search') }
                                    value={ searchValue }
                                    onChange={ e => updateSearchValue(e.target.value) }
                                />
                            </AlignInput.Wrapper>
                        </AlignInput.Root>
                        <div className="max-h-56 overflow-y-auto rounded-xl ring-1 ring-inset ring-stroke-soft-200">
                            { results && results.length > 0 ? (
                                <ul className="divide-y divide-stroke-soft-200">
                                    { results.map((n, index) => (
                                        <li
                                            key={ index }
                                            className="group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-bg-weak-50"
                                        >
                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-weak-50 text-label-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                                                { getInitial(n) }
                                            </div>
                                            <div className="flex-1 truncate text-paragraph-sm text-text-strong-950">{ n }</div>
                                            <RiArrowRightSLine className="size-4 text-text-soft-400 opacity-0 transition-opacity group-hover:opacity-100" />
                                        </li>
                                    )) }
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                        <RiSearchEyeLine className="size-5 text-text-soft-400" />
                                    </div>
                                    <div className="text-paragraph-sm text-text-soft-400">{ safeLocalize('notifications.search.empty', 'Keine Ergebnisse gefunden') }</div>
                                </div>
                            ) }
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 border-t border-stroke-soft-200 px-5 py-4">
                        { (!item.clickUrl || item.clickUrl.length === 0) ? (
                            <AlignButton.Root variant="neutral" mode="stroke" size="small" className="min-w-[120px]" onClick={ onClose }>
                                { LocalizeText('generic.close') }
                            </AlignButton.Root>
                        ) : (
                            <>
                                <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ onClose }>
                                    { LocalizeText('generic.close') }
                                </AlignButton.Root>
                                <AlignButton.Root variant="primary" mode="filled" size="small" className="min-w-[140px]" onClick={ visitUrl }>
                                    { LocalizeText(item.clickUrlText) }
                                </AlignButton.Root>
                            </>
                        ) }
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
}
