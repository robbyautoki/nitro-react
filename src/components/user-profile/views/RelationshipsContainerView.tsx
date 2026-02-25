import { RelationshipStatusEnum, RelationshipStatusInfoMessageParser } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { GetUserProfile, LocalizeText } from '../../../api';
import { LayoutAvatarImageView } from '../../../common';

interface RelationshipsContainerViewProps
{
    relationships: RelationshipStatusInfoMessageParser;
}

const RELATIONSHIP_META: Record<number, { icon: string; label: string; color: string }> = {
    [RelationshipStatusEnum.HEART]: { icon: '❤️', label: 'Herz', color: 'bg-rose-50 border-rose-100' },
    [RelationshipStatusEnum.SMILE]: { icon: '😊', label: 'Lächeln', color: 'bg-amber-50 border-amber-100' },
    [RelationshipStatusEnum.BOBBA]: { icon: '💀', label: 'Bobba', color: 'bg-zinc-50 border-zinc-200' },
};

export const RelationshipsContainerView: FC<RelationshipsContainerViewProps> = ({ relationships }) =>
{
    if(!relationships || !relationships.relationshipStatusMap.length) 
    {
        return (
            <div className="flex items-center justify-center h-20 text-sm text-zinc-300">
                Keine Beziehungen
            </div>
        );
    }

    const types = [ RelationshipStatusEnum.HEART, RelationshipStatusEnum.SMILE, RelationshipStatusEnum.BOBBA ];

    return (
        <div className="flex flex-col gap-2">
            { types.map(type =>
            {
                const info = relationships.relationshipStatusMap.hasKey(type)
                    ? relationships.relationshipStatusMap.getValue(type)
                    : null;
                const meta = RELATIONSHIP_META[type];
                const relationshipName = RelationshipStatusEnum.RELATIONSHIP_NAMES[type].toLocaleLowerCase();

                return (
                    <div key={ type } className={ `flex items-center gap-3 px-3 py-2 rounded-xl border ${ meta.color }` }>
                        <span className="text-base shrink-0">{ meta.icon }</span>
                        { info && info.friendCount > 0 ? (
                            <>
                                <div
                                    className="w-8 h-8 shrink-0 rounded-full bg-white border border-zinc-200 overflow-hidden cursor-pointer relative"
                                    onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }
                                >
                                    <LayoutAvatarImageView figure={ info.randomFriendFigure } headOnly direction={ 4 } />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span
                                        className="text-xs font-medium text-zinc-700 hover:text-zinc-900 cursor-pointer underline decoration-zinc-300 truncate block"
                                        onClick={ () => info.randomFriendId >= 1 && GetUserProfile(info.randomFriendId) }
                                    >
                                        { info.randomFriendName }
                                    </span>
                                    { info.friendCount > 1 && (
                                        <span className="text-[10px] text-zinc-400">
                                            { LocalizeText(`extendedprofile.relstatus.others.${ relationshipName }`, [ 'count' ], [ (info.friendCount - 1).toString() ]) }
                                        </span>
                                    ) }
                                </div>
                            </>
                        ) : (
                            <span className="text-xs text-zinc-400 italic">
                                { LocalizeText('extendedprofile.add.friends') }
                            </span>
                        ) }
                    </div>
                );
            }) }
        </div>
    );
};
