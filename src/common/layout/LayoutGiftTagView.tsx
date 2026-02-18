import { FC } from 'react';
import { Column, Flex, Text } from '..';
import { LocalizeText } from '../../api';
import { LayoutAvatarImageView } from './LayoutAvatarImageView';

interface LayoutGiftTagViewProps
{
    figure?: string;
    userName?: string;
    message?: string;
    editable?: boolean;
    onChange?: (value: string) => void;
}

export const LayoutGiftTagView: FC<LayoutGiftTagViewProps> = props =>
{
    const { figure = null, userName = null, message = null, editable = false, onChange = null } = props;
    
    return (
        <Flex overflow="hidden" className="nitro-gift-card text-white/90">
            <div className="flex items-center justify-center gift-face shrink-0">
                { !userName && <div className="gift-incognito"></div> }
                { figure && <div className="gift-avatar">
                    <LayoutAvatarImageView figure={ figure } direction={ 2 } headOnly={ true } />
                </div> }
            </div>
            <Flex overflow="hidden" className="w-full pt-4 pb-4 pr-6 pl-4">
                <Column grow overflow="auto" justifyContent="between">
                    { !editable &&
                        <Text textBreak className="gift-message">{ message }</Text> }
                    { editable && (onChange !== null) &&
                        <textarea className="gift-message h-full" maxLength={ 140 } value={ message } onChange={ (e) => onChange(e.target.value) } placeholder={ LocalizeText('catalog.gift_wrapping_new.message_hint') }></textarea> }
                    { userName &&
                        <Text italics textEnd className="pr-1">{ LocalizeText('catalog.gift_wrapping_new.message_from', [ 'name' ], [ userName ]) }</Text> }
                </Column>
            </Flex>
        </Flex>
    );
};
