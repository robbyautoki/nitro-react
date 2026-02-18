import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import DOMPurify from 'dompurify';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Drawer as DrawerPrimitive } from 'vaul';
import { AddEventLinkTracker, ChatEntryType, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { InfiniteScroll } from '../../common';
import { useChatHistory } from '../../hooks';
import { DrawerClose } from '../ui/drawer';

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
        <DrawerPrimitive.Root
            direction="right"
            open={ isVisible }
            onOpenChange={ setIsVisible }
            modal={ false }
        >
            <DrawerPrimitive.Portal>
                { isVisible && <div className="fixed inset-0 z-[78]" onClick={ () => setIsVisible(false) } /> }
                <DrawerPrimitive.Content
                    className="fixed right-0 top-0 bottom-0 w-[420px] z-[79] flex flex-col rounded-l-2xl border border-white/[0.09] bg-[rgba(10,10,14,0.98)] shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl overflow-hidden"
                    style={ { '--initial-transform': 'calc(100%)' } as React.CSSProperties }
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 py-4 shrink-0 border-b border-white/10">
                        <h2 className="flex-1 text-base font-bold text-white/90 tracking-tight">
                            { LocalizeText('room.chathistory.button.text') }
                        </h2>
                        <input
                            type="text"
                            className="bg-white/[0.07] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/30 outline-none focus:border-white/20 w-32 transition-colors"
                            placeholder={ LocalizeText('generic.search') }
                            value={ searchText }
                            onChange={ event => setSearchText(event.target.value) }
                        />
                        <DrawerClose className="appearance-none border-0 bg-transparent rounded-lg p-1.5 text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors">
                            <FaTimes className="text-xs" />
                        </DrawerClose>
                    </div>

                    {/* Message list */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-1" ref={ elementRef }>
                        <InfiniteScroll rows={ filteredChatHistory } scrollToBottom={ true } rowRender={ row =>
                        {
                            if(row.type === ChatEntryType.TYPE_ROOM_INFO)
                            {
                                return (
                                    <div className="flex items-center gap-2 py-2 my-1">
                                        <div className="flex-1 h-px bg-white/10" />
                                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/30 uppercase tracking-wider shrink-0">
                                            <i className="icon icon-small-room opacity-50" />
                                            { row.name }
                                        </span>
                                        <div className="flex-1 h-px bg-white/10" />
                                    </div>
                                );
                            }

                            return (
                                <div className="flex items-start gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                                    { row.imageUrl && row.imageUrl.length > 0
                                        ? <div
                                            className="w-8 h-8 shrink-0 rounded-full bg-white/[0.06] border border-white/[0.08] overflow-hidden mt-0.5"
                                            style={ { backgroundImage: `url(${ row.imageUrl })`, backgroundSize: 'cover', backgroundPosition: 'center top' } }
                                        />
                                        : <div className="w-8 h-8 shrink-0 rounded-full bg-white/[0.06] border border-white/[0.08] mt-0.5" />
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span
                                                className="text-xs font-semibold text-white/90 shrink-0"
                                                dangerouslySetInnerHTML={ { __html: DOMPurify.sanitize(row.name) } }
                                            />
                                            <span className="text-[10px] text-white/25 shrink-0">{ row.timestamp }</span>
                                        </div>
                                        <p
                                            className="text-xs text-white/60 leading-relaxed break-words mt-0.5"
                                            dangerouslySetInnerHTML={ { __html: DOMPurify.sanitize(row.message) } }
                                        />
                                    </div>
                                </div>
                            );
                        } } />
                    </div>
                </DrawerPrimitive.Content>
            </DrawerPrimitive.Portal>
        </DrawerPrimitive.Root>
    );
}
