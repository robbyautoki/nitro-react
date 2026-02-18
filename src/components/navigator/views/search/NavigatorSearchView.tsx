import { FC, KeyboardEvent, useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { LocalizeText } from '../../../../api';
import { useNavigator } from '../../../../hooks';
import { Input } from '@/components/ui/input';

export interface NavigatorSearchViewProps
{
    sendSearch: (searchValue: string, contextCode: string) => void;
}

export const NavigatorSearchView: FC<NavigatorSearchViewProps> = props =>
{
    const { sendSearch = null } = props;
    const [ searchValue, setSearchValue ] = useState('');
    const { topLevelContext = null, searchResult = null } = useNavigator();

    const processSearch = () =>
    {
        if(!topLevelContext) return;

        sendSearch(searchValue || '', topLevelContext.code);
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        if(event.key !== 'Enter') return;

        processSearch();
    };

    useEffect(() =>
    {
        if(!searchResult) return;

        setSearchValue(searchResult.data || '');
    }, [ searchResult ]);

    return (
        <div className="relative">
            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-zinc-500" />
            <Input
                type="text"
                placeholder={ LocalizeText('navigator.filter.input.placeholder') }
                value={ searchValue }
                onChange={ event => setSearchValue(event.target.value) }
                onKeyDown={ event => handleKeyDown(event) }
                className="h-8 text-xs pl-8 rounded-lg bg-white/10 border-0 text-white focus-visible:bg-white/15 focus-visible:ring-1 focus-visible:ring-white/20 transition-all duration-200 placeholder:text-zinc-500"
            />
        </div>
    );
}
