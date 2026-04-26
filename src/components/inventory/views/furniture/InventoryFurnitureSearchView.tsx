import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { GroupItem, LocalizeText } from '../../../../api';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';

export interface InventoryFurnitureSearchViewProps
{
    groupItems: GroupItem[];
    setGroupItems: Dispatch<SetStateAction<GroupItem[]>>;
}

export const InventoryFurnitureSearchView: FC<InventoryFurnitureSearchViewProps> = props =>
{
    const { groupItems = [], setGroupItems = null } = props;
    const [ searchValue, setSearchValue ] = useState('');

    useEffect(() =>
    {
        let filtered = [ ...groupItems ];

        if(searchValue && searchValue.length)
        {
            const q = searchValue.toLocaleLowerCase();
            filtered = groupItems.filter(item => item.name.toLocaleLowerCase().includes(q));
        }

        setGroupItems(filtered);
    }, [ groupItems, setGroupItems, searchValue ]);

    return (
        <AlignInput.Root size="xsmall" className="min-w-0 flex-1">
            <AlignInput.Wrapper className="h-7">
                <AlignInput.Icon as={ Search } className="size-3.5" />
                <AlignInput.Input
                    type="text"
                    className="h-7 text-paragraph-xs"
                    placeholder={ LocalizeText('generic.search') }
                    value={ searchValue }
                    onChange={ e => setSearchValue(e.target.value) }
                />
                { searchValue && (
                    <AlignButton.Root
                        type="button"
                        variant="neutral"
                        mode="ghost"
                        size="xxsmall"
                        className="size-5 px-0"
                        onClick={ () => setSearchValue('') }
                    >
                        <X className="size-3" />
                    </AlignButton.Root>
                ) }
            </AlignInput.Wrapper>
        </AlignInput.Root>
    );
}
