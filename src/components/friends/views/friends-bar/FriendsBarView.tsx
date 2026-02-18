import { FC, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MessengerFriend } from '../../../../api';
import { Button } from '@/components/ui/button';
import { FriendBarItemView } from './FriendBarItemView';

const MAX_DISPLAY_COUNT = 2;

export const FriendBarView: FC<{ onlineFriends: MessengerFriend[] }> = props =>
{
    const { onlineFriends = null } = props;
    const [ indexOffset, setIndexOffset ] = useState(0);
    const elementRef = useRef<HTMLDivElement>();

    return (
        <div ref={ elementRef } className="friend-bar flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg bg-transparent border border-black/[0.06] text-gray-400 hover:bg-black/[0.05] hover:text-gray-600 disabled:opacity-25 shrink-0"
                disabled={ (indexOffset <= 0) }
                onClick={ event => setIndexOffset(indexOffset - 1) }
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            { Array.from(Array(MAX_DISPLAY_COUNT), (e, i) => <FriendBarItemView key={ i } friend={ (onlineFriends[ indexOffset + i ] || null) } />) }
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg bg-transparent border border-black/[0.06] text-gray-400 hover:bg-black/[0.05] hover:text-gray-600 disabled:opacity-25 shrink-0"
                disabled={ !((onlineFriends.length > MAX_DISPLAY_COUNT) && ((indexOffset + MAX_DISPLAY_COUNT) <= (onlineFriends.length - 1))) }
                onClick={ event => setIndexOffset(indexOffset + 1) }
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
