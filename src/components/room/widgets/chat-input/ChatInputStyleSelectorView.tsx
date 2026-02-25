import { FC, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Palette } from 'lucide-react';

interface ChatInputStyleSelectorViewProps
{
    chatStyleId: number;
    chatStyleIds: number[];
    selectChatStyleId: (styleId: number) => void;
}

export const ChatInputStyleSelectorView: FC<ChatInputStyleSelectorViewProps> = props =>
{
    const { chatStyleId = 0, chatStyleIds = null, selectChatStyleId = null } = props;
    const [ selectorVisible, setSelectorVisible ] = useState(false);

    const selectStyle = (styleId: number) =>
    {
        selectChatStyleId(styleId);
        setSelectorVisible(false);
    }

    return (
        <Popover open={ selectorVisible } onOpenChange={ setSelectorVisible }>
            <PopoverTrigger asChild>
                <button className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors" title="Chat-Style">
                    <Palette className="w-5 h-5" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                sideOffset={ 12 }
                className="w-[320px] p-0"
                onOpenAutoFocus={ (e) => e.preventDefault() }
            >
                <div className="px-3 pt-3 pb-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Chat-Style</span>
                </div>
                <ScrollArea className="max-h-[260px]">
                    <div className="grid grid-cols-5 gap-1.5 px-3 pt-1 pb-4" style={{ imageRendering: 'pixelated' }}>
                        { chatStyleIds && chatStyleIds.map((styleId) => (
                            <TooltipProvider key={ styleId } delayDuration={ 200 }>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={ () => selectStyle(styleId) }
                                            className={ `relative flex items-center justify-center h-[30px] rounded-lg border-2 transition-all overflow-hidden
                                                ${ chatStyleId === styleId
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                    : 'border-border/20 hover:border-border/50 bg-muted/5 hover:bg-accent/20' }` }
                                        >
                                            <div className="bubble-container" style={ { width: 40, height: 22, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' } }>
                                                <div className={ `chat-bubble bubble-${ styleId }` } style={ { minHeight: 0, maxWidth: 'none', fontSize: 0, padding: '2px 8px', lineHeight: 0 } }>&nbsp;</div>
                                            </div>
                                            { chatStyleId === styleId && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-tl-md flex items-center justify-center">
                                                    <span className="text-[7px] text-primary-foreground font-bold">✓</span>
                                                </div>
                                            ) }
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={ 4 }>
                                        <span className="text-[11px]">#{ styleId }</span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )) }
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
