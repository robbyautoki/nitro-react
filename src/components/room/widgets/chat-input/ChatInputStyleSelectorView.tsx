import { FC, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

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
                <div className="icon chatstyles-icon shrink-0 ml-1 cursor-pointer transition-opacity hover:opacity-70" />
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                sideOffset={ 8 }
                className="w-[210px] max-h-[200px] p-0 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-lg"
            >
                <ScrollArea className="h-full max-h-[200px]">
                    <div className="nitro-chat-style-selector-container grid grid-cols-3 gap-1 p-2 image-rendering-pixelated">
                        { chatStyleIds && (chatStyleIds.length > 0) && chatStyleIds.map((styleId) =>
                        {
                            return (
                                <div
                                    key={ styleId }
                                    className="bubble-parent-container flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-gray-100"
                                    onClick={ event => selectStyle(styleId) }
                                >
                                    <div className="bubble-container">
                                        <div className={ `chat-bubble bubble-${ styleId }` }>&nbsp;</div>
                                    </div>
                                </div>
                            );
                        }) }
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
