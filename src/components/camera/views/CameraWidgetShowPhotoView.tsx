import { FC, useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, UserRound } from 'lucide-react';
import { GetUserProfile, IPhotoData, LocalizeText } from '../../../api';
import * as AlignButton from '@/align-ui/components/ui/button';

export interface CameraWidgetShowPhotoViewProps
{
    currentIndex: number;
    currentPhotos: IPhotoData[];
}

export const CameraWidgetShowPhotoView: FC<CameraWidgetShowPhotoViewProps> = props =>
{
    const { currentIndex = -1, currentPhotos = null } = props;
    const [ imageIndex, setImageIndex ] = useState(0);

    const currentImage = (currentPhotos && currentPhotos.length) ? currentPhotos[imageIndex] : null;

    const next = () =>
    {
        setImageIndex(prevValue =>
        {
            let newIndex = (prevValue + 1);

            if(newIndex >= currentPhotos.length) newIndex = 0;

            return newIndex;
        });
    }

    const previous = () =>
    {
        setImageIndex(prevValue =>
        {
            let newIndex = (prevValue - 1);

            if(newIndex < 0) newIndex = (currentPhotos.length - 1);

            return newIndex;
        });
    }

    useEffect(() =>
    {
        setImageIndex(currentIndex);
    }, [ currentIndex ]);

    if(!currentImage) return null;

    return (
        <div className="nitro-photo-viewer-body">
            <div className="nitro-photo-frame" style={ currentImage.w ? { backgroundImage: 'url(' + currentImage.w + ')' } : {} }>
                { !currentImage.w &&
                    <div className="text-label-sm text-text-sub-600">{ LocalizeText('camera.loading') }</div> }
            </div>
            { currentImage.m && currentImage.m.length &&
                <div className="text-center text-paragraph-sm text-text-strong-950">{ currentImage.m }</div> }
            <div className="nitro-photo-meta">
                <button type="button" className="inline-flex min-w-0 items-center gap-2 text-label-xs text-primary-base hover:underline" onClick={ event => GetUserProfile(currentImage.oi) }>
                    <UserRound className="size-3.5 shrink-0" />
                    <span className="truncate">{ currentImage.o || currentImage.n || '' }</span>
                </button>
                <span className="inline-flex items-center gap-2 text-label-xs text-text-sub-600">
                    <CalendarDays className="size-3.5" />
                    { new Date(currentImage.t * 1000).toLocaleDateString('de-DE') }
                </span>
            </div>
            { (currentPhotos.length > 1) &&
                <div className="nitro-photo-nav">
                    <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" className="size-8 p-0" onClick={ previous }>
                        <AlignButton.Icon as={ ChevronLeft } className="size-4" />
                    </AlignButton.Root>
                    <span className="text-label-xs text-text-sub-600">{ imageIndex + 1 }/{ currentPhotos.length }</span>
                    <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" className="size-8 p-0" onClick={ next }>
                        <AlignButton.Icon as={ ChevronRight } className="size-4" />
                    </AlignButton.Root>
                </div>
            }
        </div>
    );
}
