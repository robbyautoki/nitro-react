import { FC, useEffect, useState } from 'react';
import { LocalizeText, NotificationAlertItem, OpenUrl } from '../../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import { Frame, FramePanel } from '../../../ui/frame';
import { Button } from '../../../ui/button';
import { Separator } from '../../../ui/separator';
import { Search, X } from 'lucide-react';

interface NotificationSearchAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

export const NotificationSeachAlertView: FC<NotificationSearchAlertViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const title = item.title || '';

    const [ searchValue, setSearchValue ] = useState('');
    const [ results, setResults ] = useState<string[]>([]);

    const visitUrl = () =>
    {
        OpenUrl(item.clickUrl);
        onClose();
    };

    const updateSearchValue = (value: string) =>
    {
        let res = JSON.parse(item.messages[0]);
        setResults(res.filter((val: string) => val.includes(value)));
        setSearchValue(value);
    };

    useEffect(() =>
    {
        setResults(JSON.parse(item.messages[0]));
    }, [ item ]);

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[420px]">
                <Frame className="relative">
                    <div className="drag-handler absolute inset-0 cursor-move" />
                    <FramePanel className="overflow-hidden p-0! relative z-10">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b">
                            <div className="flex items-center gap-2">
                                <Search className="size-4 text-muted-foreground" />
                                <span className="text-sm font-semibold">{ title }</span>
                            </div>
                            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={ onClose }>
                                <X className="size-3.5" />
                            </button>
                        </div>
                        <div className="px-4 pt-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={ LocalizeText('generic.search') }
                                    value={ searchValue }
                                    onChange={ e => updateSearchValue(e.target.value) }
                                    className="w-full h-8 pl-8 pr-3 text-sm bg-muted rounded-md border-0 outline-none placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>
                        <div className="px-4 py-3 space-y-1 max-h-40 overflow-y-auto">
                            { results && results.map((n, index) => (
                                <div key={ index } className="text-sm text-muted-foreground py-1 px-2 rounded-md hover:bg-muted cursor-pointer">{ n }</div>
                            )) }
                            { (!results || results.length === 0) && (
                                <div className="text-sm text-muted-foreground/50 text-center py-4">Keine Ergebnisse</div>
                            ) }
                        </div>
                        <Separator />
                        <div className="px-4 py-3">
                            { !item.clickUrl && (
                                <Button className="w-full" size="sm" onClick={ onClose }>{ LocalizeText('generic.close') }</Button>
                            ) }
                            { item.clickUrl && item.clickUrl.length > 0 && (
                                <Button className="w-full" size="sm" onClick={ visitUrl }>{ LocalizeText(item.clickUrlText) }</Button>
                            ) }
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </DraggableWindow>
    );
}
