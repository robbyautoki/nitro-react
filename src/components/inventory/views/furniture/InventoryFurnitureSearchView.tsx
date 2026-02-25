import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { GroupItem, LocalizeText } from '../../../../api';

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
        <div className="inv-search-wrap">
            <FaSearch className="inv-search-icon" />
            <input
                type="text"
                className="inv-search-input"
                placeholder={ LocalizeText('generic.search') }
                value={ searchValue }
                onChange={ e => setSearchValue(e.target.value) }
            />
            { searchValue && (
                <button className="inv-search-clear" onClick={ () => setSearchValue('') }>
                    <FaTimes />
                </button>
            ) }
        </div>
    );
}
