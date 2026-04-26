import { FC } from 'react';
import { Flag, Image as ImageIcon } from 'lucide-react';
import { GetSessionDataManager, ReportType } from '../../../../api';
import { useFurnitureExternalImageWidget, useHelp } from '../../../../hooks';
import { CameraWidgetShowPhotoView } from '../../../camera/views/CameraWidgetShowPhotoView';
import * as AlignButton from '@/align-ui/components/ui/button';
import { FurnitureWidgetActions, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

export const FurnitureExternalImageView: FC<{}> = props =>
{
    const { objectId = -1, currentPhotoIndex = -1, currentPhotos = null, onClose = null } = useFurnitureExternalImageWidget();
    const { report = null } = useHelp();

    if((objectId === -1) || (currentPhotoIndex === -1)) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="nitro-external-image-widget"
            title="Foto"
            subtitle="Wandbild anzeigen"
            icon={ ImageIcon }
            onClose={ onClose }
            widthClassName="w-[390px]"
            bodyClassName="!p-0"
            footer={
                <FurnitureWidgetActions>
                    <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" className="w-full" onClick={ () => report(ReportType.PHOTO, { extraData: currentPhotos[currentPhotoIndex].w, roomId: currentPhotos[currentPhotoIndex].s, reportedUserId: GetSessionDataManager().userId, roomObjectId: Number(currentPhotos[currentPhotoIndex].u) }) }>
                        <AlignButton.Icon as={ Flag } className="size-4" />
                        Melden
                    </AlignButton.Root>
                </FurnitureWidgetActions>
            }
        >
            <CameraWidgetShowPhotoView currentIndex={ currentPhotoIndex } currentPhotos={ currentPhotos } />
        </FurnitureWidgetWindow>
    );
}
