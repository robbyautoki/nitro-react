import { FC, useMemo } from 'react';
import { GetConfiguration } from '../../api';
import { Base, BaseProps } from '../Base';

export interface LayoutRoomThumbnailViewProps extends BaseProps<HTMLDivElement>
{
    roomId?: number;
    customUrl?: string;
}

export const LayoutRoomThumbnailView: FC<LayoutRoomThumbnailViewProps> = props =>
{
    const { roomId = -1, customUrl = null, shrink = true, overflow = 'hidden', classNames = [], children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'room-thumbnail' ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames ]);

    const getImageUrl = useMemo(() =>
    {
        if(customUrl && customUrl.length) return (GetConfiguration<string>('image.library.url') + customUrl);

        const baseUrl = GetConfiguration<string>('thumbnails.url').replace('%thumbnail%', roomId.toString());

        let cacheBuster: string | null = null;
        try
        {
            cacheBuster = window.localStorage.getItem(`room-thumbnail-v:${ roomId }`);
        }
        catch(_e)
        {
            cacheBuster = null;
        }

        return cacheBuster ? `${ baseUrl }?v=${ cacheBuster }` : baseUrl;
    }, [ customUrl, roomId ]);

    return (
        <Base shrink={ shrink } overflow={ overflow } classNames={ getClassNames } { ...rest }>
            { getImageUrl && (
                <img
                    alt=""
                    src={ getImageUrl }
                    onError={ e =>
                    {
                        const img = e.currentTarget;
                        if(img.dataset.fallbackApplied === '1') return;
                        img.dataset.fallbackApplied = '1';
                        img.src = '/navigator/thumbnail_placeholder.png';
                    } }
                />
            ) }
            { children }
        </Base>
    );
}
