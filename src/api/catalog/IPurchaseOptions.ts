import { IObjectData } from '@nitrots/nitro-renderer';
import { IPurchasableOffer } from './IPurchasableOffer';

export interface IPurchaseOptions
{
    quantity?: number;
    extraData?: string;
    extraParamRequired?: boolean;
    previewStuffData?: IObjectData;
    selectedOffers?: IPurchasableOffer[];
    multiSelectMode?: boolean;
}
