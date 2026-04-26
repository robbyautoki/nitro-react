import { CatalogGroupsComposer, StringDataType } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { LocalizeText, SendMessageComposer } from '../../../../../api';
import { Base, Flex } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { CatalogNativeSelect } from '../../CatalogNativeSelect';
import * as AlignButton from '@/align-ui/components/ui/button';

export const CatalogGuildSelectorWidgetView: FC<{}> = props =>
{
    const [ selectedGroupIndex, setSelectedGroupIndex ] = useState<number>(0);
    const { currentOffer = null, catalogOptions = null, setPurchaseOptions = null } = useCatalog();
    const { groups = null } = catalogOptions;

    const previewStuffData = useMemo(() =>
    {
        if(!groups || !groups.length) return null;

        const group = groups[selectedGroupIndex];

        if(!group) return null;

        const stuffData = new StringDataType();

        stuffData.setValue([ '0', group.groupId.toString(), group.badgeCode, group.colorA, group.colorB ]);

        return stuffData;
    }, [ selectedGroupIndex, groups ]);

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.extraParamRequired = true;
            newValue.extraData = ((previewStuffData && previewStuffData.getValue(1)) || null);
            newValue.previewStuffData = previewStuffData;

            return newValue;
        });
    }, [ currentOffer, previewStuffData, setPurchaseOptions ]);

    useEffect(() =>
    {
        SendMessageComposer(new CatalogGroupsComposer());
    }, []);

    if(!groups || !groups.length)
    {
        return (
            <Base className="rounded-10 bg-bg-weak-50 p-2 text-center text-paragraph-xs text-text-sub-600">
                { LocalizeText('catalog.guild_selector.members_only') }
                <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="mt-1">
                    { LocalizeText('catalog.guild_selector.find_groups') }
                </AlignButton.Root>
            </Base>
        );
    }

    const selectedGroup = groups[selectedGroupIndex];

    return (
        <Flex gap={ 1 }>
            { !!selectedGroup &&
                <Flex overflow="hidden" className="rounded border">
                    <Base fullHeight style={ { width: '20px', backgroundColor: '#' + selectedGroup.colorA } } />
                    <Base fullHeight style={ { width: '20px', backgroundColor: '#' + selectedGroup.colorB } } />
                </Flex> }
            <CatalogNativeSelect value={ selectedGroupIndex } onChange={ event => setSelectedGroupIndex(parseInt(event.target.value)) }>
                { groups.map((group, index) => <option key={ index } value={ index }>{ group.groupName }</option>) }
            </CatalogNativeSelect>
        </Flex>
    );
}
