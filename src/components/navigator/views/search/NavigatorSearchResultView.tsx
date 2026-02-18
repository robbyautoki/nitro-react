import { NavigatorSearchResultList } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { NavigatorSearchResultItemView } from './NavigatorSearchResultItemView';

export interface NavigatorSearchResultViewProps
{
    searchResult: NavigatorSearchResultList;
}

export const NavigatorSearchResultView: FC<NavigatorSearchResultViewProps> = props =>
{
    const { searchResult = null } = props;

    if(!searchResult.rooms.length) return null;

    return (
        <div>
            <div className="flex flex-col gap-px nav-group-items">
                { searchResult.rooms.map((room, index) =>
                    <NavigatorSearchResultItemView key={ index } roomData={ room } />
                ) }
            </div>
        </div>
    );
}
