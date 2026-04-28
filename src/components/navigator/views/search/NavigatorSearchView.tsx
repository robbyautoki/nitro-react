import { FC, KeyboardEvent, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { useNavigator } from '../../../../hooks';
import { NavSearchIcon, NavigatorTextInput } from '../NavigatorPrimitives';

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
        <NavigatorTextInput
            icon={ NavSearchIcon }
            type="text"
            placeholder={ LocalizeText('navigator.filter.input.placeholder') }
            value={ searchValue }
            onChange={ event => setSearchValue(event.target.value) }
            onKeyDown={ event => handleKeyDown(event) }
        />
    );
}
