import { FC } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { ICatalogNode } from '../../../../api';
import { Base, LayoutGridItem, Text } from '../../../../common';
import { useCatalog } from '../../../../hooks';
import { CatalogIconView } from '../catalog-icon/CatalogIconView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationItemViewProps
{
    node: ICatalogNode;
    child?: boolean;
}

export const CatalogNavigationItemView: FC<CatalogNavigationItemViewProps> = props =>
{
    const { node = null, child = false } = props;
    const { activateNode = null } = useCatalog();

    return (
        <Base className="nitro-catalog-navigation-section">
            <LayoutGridItem gap={ 1 } column={ false } itemActive={ node.isActive } onClick={ event => activateNode(node) } className={ child ? 'inset' : '' }>
                <CatalogIconView icon={ node.iconId } />
                <Text grow truncate>{ node.localization }</Text>
                { node.isBranch &&
                    <FaChevronRight className={ `fa-icon nav-chevron ${ node.isOpen ? 'expanded' : '' }` } /> }
            </LayoutGridItem>
            { node.isOpen && node.isBranch &&
                <CatalogNavigationSetView node={ node } child={ true } /> }
        </Base>
    );
}
