import { GuideSessionGetRequesterRoomMessageComposer, GuideSessionInviteRequesterMessageComposer, GuideSessionMessageMessageComposer, GuideSessionRequesterRoomMessageEvent, GuideSessionResolvedMessageComposer } from '@nitrots/nitro-renderer';
import { FC, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { GetSessionDataManager, GuideToolMessageGroup, LocalizeText, SendMessageComposer, TryVisitRoom } from '../../../api';
import { LayoutAvatarImageView } from '../../../common';
import { useMessageEvent } from '../../../hooks';

interface GuideToolOngoingViewProps
{
    isGuide: boolean;
    userId: number;
    userName: string;
    userFigure: string;
    isTyping: boolean;
    messageGroups: GuideToolMessageGroup[];
}

export const GuideToolOngoingView: FC<GuideToolOngoingViewProps> = props =>
{
    const scrollDiv = useRef<HTMLDivElement>(null);

    const { isGuide = false, userId = 0, userName = null, userFigure = null, isTyping = false, messageGroups = [] } = props;

    const [ messageText, setMessageText ] = useState<string>('');

    useEffect(() =>
    {
        scrollDiv.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, [ messageGroups ]);

    const visit = useCallback(() =>
    {
        SendMessageComposer(new GuideSessionGetRequesterRoomMessageComposer());
    }, []);

    const invite = useCallback(() =>
    {
        SendMessageComposer(new GuideSessionInviteRequesterMessageComposer());
    }, []);

    const resolve = useCallback(() =>
    {
        SendMessageComposer(new GuideSessionResolvedMessageComposer());
    }, []);

    useMessageEvent<GuideSessionRequesterRoomMessageEvent>(GuideSessionRequesterRoomMessageEvent, event =>
    {
        const parser = event.getParser();
        TryVisitRoom(parser.requesterRoomId);
    });

    const sendMessage = useCallback(() =>
    {
        if(!messageText || !messageText.length) return;
        SendMessageComposer(new GuideSessionMessageMessageComposer(messageText));
        setMessageText('');
    }, [ messageText ]);

    const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) =>
    {
        if(event.key !== 'Enter') return;
        sendMessage();
    }, [ sendMessage ]);

    const isOwnChat = useCallback((userId: number) =>
    {
        return userId === GetSessionDataManager().userId;
    }, []);

    return (
        <div className="flex flex-col h-full gap-2">
            {/* Partner-Info Header */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
                <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-accent/50 shrink-0">
                        <LayoutAvatarImageView figure={ userFigure } headOnly={ true } direction={ 2 } className="!absolute -top-1" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground">{ userName }</span>
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        </div>
                        { !isGuide && (
                            <span className="text-[11px] text-muted-foreground">{ LocalizeText('guide.help.request.user.ongoing.guide.desc') }</span>
                        ) }
                    </div>
                </div>
                { isGuide && (
                    <div className="flex items-center gap-1.5">
                        <button className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-accent/60 text-foreground/80 hover:bg-accent transition-colors" onClick={ visit }>
                            Besuchen
                        </button>
                        <button className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-accent/60 text-foreground/80 hover:bg-accent transition-colors" onClick={ invite }>
                            Einladen
                        </button>
                    </div>
                ) }
            </div>

            {/* Chat-Nachrichten */}
            <div className="flex-1 overflow-hidden rounded-lg bg-muted/30 border border-border/30">
                <div className="h-full overflow-y-auto p-3 space-y-3">
                    { messageGroups.map((group, index) =>
                    {
                        const own = isOwnChat(group.userId);
                        return (
                            <div key={ index } className={ `flex gap-2 ${ own ? 'flex-row-reverse' : 'flex-row' }` }>
                                { !own && (
                                    <div className="relative w-7 h-7 rounded-full overflow-hidden bg-accent/50 shrink-0 mt-4">
                                        <LayoutAvatarImageView figure={ userFigure } headOnly={ true } direction={ 2 } className="!absolute -top-1" />
                                    </div>
                                ) }
                                <div className={ `max-w-[75%] ${ own ? 'items-end' : 'items-start' }` }>
                                    <span className={ `text-[10px] font-medium text-muted-foreground mb-0.5 block ${ own ? 'text-right' : 'text-left' }` }>
                                        { own ? GetSessionDataManager().userName : userName }
                                    </span>
                                    <div className={ `rounded-xl px-3 py-2 ${ own ? 'bg-primary/20 text-foreground' : 'bg-muted text-foreground' }` }>
                                        { group.messages.map((chat, chatIndex) => (
                                            <div
                                                key={ chatIndex }
                                                className={ `text-[13px] leading-relaxed break-words ${ chat.roomId ? 'underline cursor-pointer hover:text-primary' : '' }` }
                                                onClick={ () => chat.roomId ? TryVisitRoom(chat.roomId) : null }
                                            >
                                                { chat.message }
                                            </div>
                                        )) }
                                    </div>
                                </div>
                                { own && (
                                    <div className="relative w-7 h-7 rounded-full overflow-hidden bg-accent/50 shrink-0 mt-4">
                                        <LayoutAvatarImageView figure={ GetSessionDataManager().figure } headOnly={ true } direction={ 4 } className="!absolute -top-1" />
                                    </div>
                                ) }
                            </div>
                        );
                    }) }
                    <div ref={ scrollDiv } />
                </div>
            </div>

            {/* Typing-Indikator */}
            { isTyping && (
                <span className="text-[11px] text-muted-foreground px-1">{ LocalizeText('guide.help.common.typing') }</span>
            ) }

            {/* Nachricht schreiben */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    className="flex-1 h-9 px-3 text-sm rounded-lg border border-border/50 bg-muted/50 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
                    placeholder="Nachricht schreiben..."
                    value={ messageText }
                    onChange={ event => setMessageText(event.target.value) }
                    onKeyDown={ onKeyDown }
                />
                <button
                    className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0"
                    onClick={ sendMessage }
                >
                    Senden
                </button>
            </div>

            {/* Gespräch beenden */}
            <button
                className="w-full py-2 rounded-lg border border-green-500/30 text-green-500 text-sm font-medium hover:bg-green-500/10 transition-colors"
                onClick={ resolve }
            >
                Gespräch beenden
            </button>
        </div>
    );
};
