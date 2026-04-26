import { FC, useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';
import { LocalizeText } from '../../../../api';
import { AlignGameWindow } from '../../../align-game-ui';
import { HelpNameChangeEvent } from '../../../../events';
import { useUiEvent } from '../../../../hooks';
import { NameChangeConfirmationView } from './NameChangeConfirmationView';
import { NameChangeInitView } from './NameChangeInitView';
import { NameChangeInputView } from './NameChangeInputView';

const INIT: string = 'INIT';
const INPUT: string = 'INPUT';
const CONFIRMATION: string = 'CONFIRMATION';

export const NameChangeView:FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState<boolean>(false);
    const [ layout, setLayout ] = useState<string>(INIT);
    const [ newUsername, setNewUsername ] = useState<string>('');

    const onAction = (action: string, value?: string) =>
    {
        switch(action)
        {
            case 'start':
                setLayout(INPUT);
                break;
            case 'confirmation':
                setNewUsername(value);
                setLayout(CONFIRMATION);
                break;
            case 'close':
                setNewUsername('');
                setIsVisible(false);
                break;
        }
    }

    const titleKey = useMemo(() =>
    {
        switch(layout)
        {
            case INIT: return 'tutorial.name_change.title.main';
            case INPUT: return 'tutorial.name_change.title.select';
            case CONFIRMATION: return 'tutorial.name_change.title.confirm';
        }
    }, [ layout ]);

    useUiEvent<HelpNameChangeEvent>(HelpNameChangeEvent.INIT, event =>
    {
        setLayout(INIT);
        setIsVisible(true);
    });
    
    if(!isVisible) return null;

    return (
        <AlignGameWindow
            uniqueKey="help-name-change"
            title={ LocalizeText(titleKey) }
            subtitle={ LocalizeText('tutorial.name_change.title.main') }
            icon={ <UserRound className="size-4" /> }
            onClose={ () => onAction('close') }
            widthClassName="w-[380px] max-w-[calc(100vw-32px)]"
            bodyClassName="p-4"
        >
            { layout === INIT && <NameChangeInitView onAction={ onAction } /> }
            { layout === INPUT && <NameChangeInputView onAction={ onAction } /> }
            { layout === CONFIRMATION && <NameChangeConfirmationView username={ newUsername } onAction={ onAction } /> }
        </AlignGameWindow>
    )
}
