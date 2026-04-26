import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import DOMPurify from 'dompurify';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { AddEventLinkTracker, ChatEntryType, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { InfiniteScroll } from '../../common';
import { useChatHistory } from '../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDrawer from '@/align-ui/components/ui/drawer';
import * as AlignInput from '@/align-ui/components/ui/input';

export const ChatHistoryView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ searchText, setSearchText ] = useState<string>('');
    const { chatHistory = [] } = useChatHistory();
    const elementRef = useRef<HTMLDivElement>(null);

    const filteredChatHistory = useMemo(() =>
    {
        if(searchText.length === 0) return chatHistory;

        const text = searchText.toLowerCase();

        return chatHistory.filter(entry =>
            (entry.message && entry.message.toLowerCase().includes(text)) ||
            (entry.name && entry.name.toLowerCase().includes(text))
        );
    }, [ chatHistory, searchText ]);

    useEffect(() =>
    {
        if(elementRef && elementRef.current && isVisible) elementRef.current.scrollTop = elementRef.current.scrollHeight;
    }, [ isVisible ]);

    useEffect(() =>
    {
        document.documentElement.style.setProperty('--drawer-width', isVisible ? '432px' : '0px');
        return () =>
        {
            document.documentElement.style.setProperty('--drawer-width', '0px');
        };
    }, [ isVisible ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'chat-history/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    return (
        <AlignDrawer.Root
            open={ isVisible }
            onOpenChange={ setIsVisible }
            modal={ false }
        >
            <AlignDrawer.Content
                className="w-[420px]"
                onOpenAutoFocus={ event => event.preventDefault() }
            >
                    { /* Header */ }
                    <AlignDrawer.Header className="flex-row items-center gap-3 border-b border-stroke-soft-200 bg-bg-weak-50 px-5 py-4">
                        <AlignDrawer.Title className="flex-1 text-label-md text-text-strong-950">
                            { LocalizeText('room.chathistory.button.text') }
                        </AlignDrawer.Title>
                        <AlignDrawer.Description className="sr-only">Chat-Verlauf des aktuellen Raums durchsuchen</AlignDrawer.Description>
                        <AlignInput.Root size="xsmall" className="w-32">
                            <AlignInput.Wrapper>
                                <AlignInput.Input
                                    type="text"
                                    className="h-8 text-paragraph-xs"
                                    placeholder={ LocalizeText('generic.search') }
                                    value={ searchText }
                                    onChange={ event => setSearchText(event.target.value) }
                                />
                            </AlignInput.Wrapper>
                        </AlignInput.Root>
                        <AlignButton.Root
                            type="button"
                            variant="neutral"
                            mode="ghost"
                            size="xxsmall"
                            className="size-7 p-0"
                            onClick={ () => setIsVisible(false) }
                        >
                            <AlignButton.Icon as={ X } className="size-4" />
                        </AlignButton.Root>
                    </AlignDrawer.Header>
                    { /* Message list */ }
                    <AlignDrawer.Body className="flex flex-col gap-1 px-4 py-3" ref={ elementRef }>
                        <InfiniteScroll rows={ filteredChatHistory } scrollToBottom={ true } rowRender={ row =>
                        {
                            if(row.type === ChatEntryType.TYPE_ROOM_INFO)
                            {
                                return (
                                    <div className="flex items-center gap-2 py-2 my-1">
                                        <div className="h-px flex-1 bg-stroke-soft-200" />
                                        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-soft-400">
                                            <i className="icon icon-small-room opacity-50" />
                                            { row.name }
                                        </span>
                                        <div className="h-px flex-1 bg-stroke-soft-200" />
                                    </div>
                                );
                            }

                            return (
                                <div className="flex items-start gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-bg-weak-50">
                                    { row.imageUrl && row.imageUrl.length > 0
                                        ? <div
                                            className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-stroke-soft-200 bg-bg-weak-50"
                                            style={ { backgroundImage: `url(${ row.imageUrl })`, backgroundSize: 'cover', backgroundPosition: 'center top' } }
                                        />
                                        : <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-stroke-soft-200 bg-bg-weak-50" />
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span
                                                className="shrink-0 text-label-xs text-text-strong-950"
                                                dangerouslySetInnerHTML={ { __html: DOMPurify.sanitize(row.name) } }
                                            />
                                            <span className="shrink-0 text-[10px] text-text-soft-400">{ row.timestamp }</span>
                                        </div>
                                        <p
                                            className="mt-0.5 break-words text-paragraph-xs leading-relaxed text-text-sub-600"
                                            dangerouslySetInnerHTML={ { __html: DOMPurify.sanitize(row.message) } }
                                        />
                                    </div>
                                </div>
                            );
                        } } />
                    </AlignDrawer.Body>
            </AlignDrawer.Content>
        </AlignDrawer.Root>
    );
}
