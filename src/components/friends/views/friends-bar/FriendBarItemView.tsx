import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { GetUserProfile, LocalizeText, MessengerFriend, OpenMessengerChat } from '../../../../api';
import { LayoutAvatarImageView, LayoutBadgeImageView } from '../../../../common';
import { useFriends } from '../../../../hooks';
import { cn } from '@/lib/utils';
import { UserPlus } from 'lucide-react';

export const FriendBarItemView: FC<{ friend: MessengerFriend }> = props =>
{
    const { friend = null } = props;
    const [ isVisible, setVisible ] = useState(false);
    const { followFriend = null } = useFriends();
    const elementRef = useRef<HTMLDivElement>();

    useEffect(() =>
    {
        const onClick = (event: MouseEvent) =>
        {
            const element = elementRef.current;

            if(!element) return;

            if((event.target !== element) && !element.contains((event.target as Node)))
            {
                setVisible(false);
            }
        }

        document.addEventListener(MouseEventType.MOUSE_CLICK, onClick);

        return () => document.removeEventListener(MouseEventType.MOUSE_CLICK, onClick);
    }, []);

    if(!friend)
    {
        return (
            <div ref={ elementRef } className="flex items-center justify-center w-9 h-9 mx-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-400 cursor-pointer transition-colors hover:bg-gray-200 hover:text-gray-600">
                <UserPlus className="w-4 h-4" />
            </div>
        );
    }

    return (
        <div
            ref={ elementRef }
            className={ cn(
                'friend-bar-item relative w-[130px] mx-1 pl-[38px] text-left rounded-lg bg-emerald-50 border border-emerald-200/60 py-1.5 pr-2 text-sm text-gray-800 cursor-pointer transition-colors hover:bg-emerald-100',
                isVisible && 'friend-bar-item-active mb-[21px] bg-emerald-100 ring-1 ring-emerald-300'
            ) }
            onClick={ event => setVisible(prevValue => !prevValue) }
        >
            <div className={ cn('friend-bar-item-head absolute', friend.id > 0 ? 'avatar' : 'group') }>
                { (friend.id > 0) && <LayoutAvatarImageView headOnly={ true } figure={ friend.figure } direction={ 2 } /> }
                { (friend.id <= 0) && <LayoutBadgeImageView isGroup={ true } badgeCode={ friend.figure } /> }
            </div>
            <div className="truncate">{ friend.name }</div>
            { isVisible &&
            <div className="flex justify-between mt-1">
                <div className="nitro-friends-spritesheet icon-friendbar-chat cursor-pointer transition-opacity hover:opacity-70" onClick={ event => OpenMessengerChat(friend.id) } />
                { friend.followingAllowed &&
                <div className="nitro-friends-spritesheet icon-friendbar-visit cursor-pointer transition-opacity hover:opacity-70" onClick={ event => followFriend(friend) } /> }
                <div className="nitro-friends-spritesheet icon-profile cursor-pointer transition-opacity hover:opacity-70" onClick={ event => GetUserProfile(friend.id) } />
            </div> }
        </div>
    );
}
