import { GroupInformationComposer, GroupInformationEvent, GroupInformationParser, HabboGroupEntryData } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { SendMessageComposer, ToggleFavoriteGroup } from '../../../api';
import { Base, Column, Flex, Grid, GridProps, LayoutBadgeImageView, LayoutGridItem } from '../../../common';
import { useMessageEvent } from '../../../hooks';
import { GroupInformationView } from '../../groups/views/GroupInformationView';

interface GroupsContainerViewProps extends GridProps
{
    itsMe: boolean;
    groups: HabboGroupEntryData[];
    onLeaveGroup: () => void;
}

export const GroupsContainerView: FC<GroupsContainerViewProps> = props =>
{
    const { itsMe = null, groups = null, onLeaveGroup = null, ...rest } = props;
    const [ selectedGroupId, setSelectedGroupId ] = useState<number>(null);
    const [ groupInformation, setGroupInformation ] = useState<GroupInformationParser>(null);

    useMessageEvent<GroupInformationEvent>(GroupInformationEvent, event =>
    {
        const parser = event.getParser();
        if(!selectedGroupId || (selectedGroupId !== parser.id) || parser.flag) return;
        setGroupInformation(parser);
    });

    useEffect(() =>
    {
        if(!selectedGroupId) return;
        SendMessageComposer(new GroupInformationComposer(selectedGroupId, false));
    }, [ selectedGroupId ]);

    useEffect(() =>
    {
        setGroupInformation(null);
        if(groups && groups.length > 0)
        {
            setSelectedGroupId(prevValue =>
            {
                if(prevValue === groups[0].groupId)
                    SendMessageComposer(new GroupInformationComposer(groups[0].groupId, false));
                return groups[0].groupId;
            });
        }
    }, [ groups ]);

    if(!groups || !groups.length)
    {
        return (
            <div className="flex items-center justify-center h-20 text-sm text-zinc-300">
                Keine Gruppen
            </div>
        );
    }

    return (
        <div className="flex gap-3">
            {/* Group badge grid */}
            <div className="flex flex-col gap-1.5 shrink-0 overflow-y-auto max-h-[180px]" style={ { scrollbarWidth: 'thin' } }>
                { groups.map((group, index) => (
                    <div
                        key={ index }
                        className={ `relative w-[50px] h-[50px] flex items-center justify-center rounded-lg border cursor-pointer transition-all ${
                            selectedGroupId === group.groupId
                                ? 'bg-zinc-100 border-zinc-300 shadow-sm'
                                : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200 hover:bg-zinc-100'
                        }` }
                        onClick={ () => setSelectedGroupId(group.groupId) }
                    >
                        { itsMe && (
                            <button
                                className="absolute -top-1 -right-1 z-10"
                                onClick={ (e) => { e.stopPropagation(); ToggleFavoriteGroup(group); } }
                            >
                                <Star className={ `w-3 h-3 ${ group.favourite ? 'fill-amber-400 text-amber-400' : 'text-zinc-300' }` } />
                            </button>
                        ) }
                        <LayoutBadgeImageView badgeCode={ group.badgeCode } isGroup />
                    </div>
                )) }
            </div>

            {/* Group info */}
            <div className="flex-1 min-w-0 overflow-hidden">
                { groupInformation && (
                    <GroupInformationView groupInformation={ groupInformation } onClose={ onLeaveGroup } />
                ) }
            </div>
        </div>
    );
};
