import { FC, useEffect, useMemo, useState } from 'react';
import { GetRoomEngine, GetSessionDataManager, LocalizeText, RoomObjectItem } from '../../../../api';
import { classNames, Flex, InfiniteScroll, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';

interface ChooserWidgetViewProps
{
    title: string;
    items: RoomObjectItem[];
    selectItem: (item: RoomObjectItem) => void;
    onClose: () => void;
}

export const ChooserWidgetView: FC<ChooserWidgetViewProps> = props =>
{
    const { title = null, items = [], selectItem = null, onClose = null } = props;
    const [ selectedItem, setSelectedItem ] = useState<RoomObjectItem>(null);
    const [ searchValue, setSearchValue ] = useState('');
    const canSeeId = GetSessionDataManager().hasSecurity(5);

    const filteredItems = useMemo(() =>
    {
        const value = searchValue.toLocaleLowerCase();

        return items.filter(item => item.name?.toLocaleLowerCase().includes(value));
    }, [ items, searchValue ]);

    useEffect(() =>
    {
        if(!selectedItem) return;

        selectItem(selectedItem);
    }, [ selectedItem, selectItem ]);

    return (
        <NitroCardView className="nitro-chooser-widget" theme="primary-slim">
            <NitroCardHeaderView headerText={ title } onCloseClick={ onClose } />
            <NitroCardContentView overflow="hidden" gap={ 2 }>
                <input type="text" className="form-control form-control-sm" placeholder={ LocalizeText('generic.search') } value={ searchValue } onChange={ event => setSearchValue(event.target.value) } />
                <InfiniteScroll rows={ filteredItems } rowRender={ row =>
                {
                    const iconUrl = row.typeId > 0
                        ? (row.isWallItem
                            ? GetRoomEngine().getFurnitureWallIconUrl(row.typeId)
                            : GetRoomEngine().getFurnitureFloorIconUrl(row.typeId))
                        : null;

                    return (
                        <Flex alignItems="center" className={ classNames('rounded p-1', (selectedItem === row) && 'bg-muted') } pointer onClick={ event => setSelectedItem(row) }>
                            { iconUrl && <img src={ iconUrl } className="chooser-icon" alt="" /> }
                            <Text truncate>{ row.name }{ canSeeId && ` [${row.id}]` }</Text>
                        </Flex>
                    );
                } } />
            </NitroCardContentView>
        </NitroCardView>
    );
}
