import { FC, KeyboardEvent, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
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
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <Input
                type="text"
                placeholder={ LocalizeText('navigator.filter.input.placeholder') }
                value={ searchValue }
                onChange={ event => setSearchValue(event.target.value) }
                onKeyDown={ event => handleKeyDown(event) }
                className="h-8 text-xs pl-8 rounded-lg"
            />
        </div>
    );
}
