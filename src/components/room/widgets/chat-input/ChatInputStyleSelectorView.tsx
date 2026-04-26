import { FC, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Palette } from 'lucide-react';

const BUBBLE_IMAGES = import.meta.glob('@/assets/images/chat/chatbubbles/bubble_*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function getBubbleImage(styleId: number): string | null
{
    const special: Record<number, string> = { 33: 'bubble_33_34', 34: 'bubble_33_34', 0: 'bubble_0_transparent' };
    const name = special[styleId] ?? `bubble_${ styleId }`;
    const match = Object.entries(BUBBLE_IMAGES).find(([ key ]) => key.includes(`/${ name }.png`));
    return match ? match[1] : null;
}

export function getBubbleImageUrl(styleId: number): string | null { return getBubbleImage(styleId); }

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
                <button className="shrink-0 text-text-soft-400 hover:text-text-strong-950 transition-colors" title="Chat-Style">
                    <Palette className="w-5 h-5" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                sideOffset={ 6 }
                collisionPadding={ 8 }
                className="w-[380px] p-0 rounded-2xl bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200 shadow-regular-md border-0"
                onOpenAutoFocus={ (e) => e.preventDefault() }
            >
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-md bg-bg-weak-50 flex items-center justify-center">
                            <Palette className="size-3.5 text-text-sub-600" />
                        </div>
                        <span className="text-[13px] font-medium text-text-strong-950">Chat-Style</span>
                    </div>
                    { chatStyleIds && <span className="text-[11px] text-text-soft-400">{ chatStyleIds.length }</span> }
                </div>
                <div className="h-px bg-stroke-soft-200" />
                <ScrollArea className="max-h-[260px]">
                    <div className="grid grid-cols-6 gap-2 px-3 py-3">
                        { chatStyleIds && chatStyleIds.map((styleId) =>
                        {
                            const img = getBubbleImage(styleId);
                            const active = chatStyleId === styleId;
                            return (
                                <TooltipProvider key={ styleId } delayDuration={ 200 }>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={ () => selectStyle(styleId) }
                                                className={ cn(
                                                    'relative flex items-center justify-center h-9 rounded-lg overflow-hidden transition-all',
                                                    active
                                                        ? 'ring-2 ring-primary-base bg-primary-alpha-10'
                                                        : 'ring-1 ring-stroke-soft-200 bg-bg-weak-50 hover:ring-stroke-sub-300 hover:bg-bg-white-0'
                                                ) }
                                            >
                                                { img
                                                    ? <img src={ img } alt={ `#${ styleId }` } className="h-6 w-auto object-contain" style={ { imageRendering: 'pixelated' } } />
                                                    : <span className="text-[10px] text-text-soft-400">#{ styleId }</span>
                                                }
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" sideOffset={ 4 } className="bg-bg-strong-950 text-text-white-0 text-[11px] rounded-md px-2 py-1 border-0">
                                            <span>#{ styleId }</span>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }) }
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
