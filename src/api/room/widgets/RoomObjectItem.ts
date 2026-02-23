export class RoomObjectItem
{
    private _id: number;
    private _category: number;
    private _name: string;
    private _typeId: number;
    private _isWallItem: boolean;

    constructor(id: number, category: number, name: string, typeId: number = 0, isWallItem: boolean = false)
    {
        this._id = id;
        this._category = category;
        this._name = name;
        this._typeId = typeId;
        this._isWallItem = isWallItem;
    }

    public get id(): number
    {
        return this._id;
    }

    public get category(): number
    {
        return this._category;
    }

    public get name(): string
    {
        return this._name;
    }

    public get typeId(): number
    {
        return this._typeId;
    }

    public get isWallItem(): boolean
    {
        return this._isWallItem;
    }
}
