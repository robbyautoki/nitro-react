export interface CustomListingItem
{
    item_id?: number;
    item_base_id: number;
    public_name: string;
    item_name: string;
    icon?: string;
    limited_data?: string;
}

export interface ItemInfo
{
    item_base_id: number;
    public_name: string;
    item_name: string;
    limited_data: string;
    rarity_type: string | null;
    in_circulation: number;
    last_sale_price: number | null;
    avg_price: number | null;
    total_sales: number;
}

export interface CustomListing
{
    id: number;
    seller_id?: number;
    price: number;
    currency: string;
    note: string | null;
    is_bundle: boolean;
    status?: string;
    expires_at: string;
    created_at: string;
    sold_at?: string;
    offer_count?: number;
    seller?: { username: string; look: string } | null;
    buyer?: string;
    items: CustomListingItem[];
}

export interface CustomOffer
{
    offer_id: number;
    listing_id: number;
    offer_price: number;
    listing_price: number;
    currency: string;
    created_at: string;
    buyer: { username: string; look: string } | null;
    items: CustomListingItem[];
}

export interface InventoryGroup
{
    item_base_id: number;
    public_name: string;
    item_name: string;
    sprite_id: number;
    count: number;
    instance_ids: number[];
}
