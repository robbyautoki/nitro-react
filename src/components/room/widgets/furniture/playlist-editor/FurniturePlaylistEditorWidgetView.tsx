import { FC } from 'react';
import { Music2 } from 'lucide-react';
import { LocalizeText } from '../../../../../api';
import { useFurniturePlaylistEditorWidget } from '../../../../../hooks';
import { FurnitureWidgetWindow } from '../FurnitureWidgetLayout';
import { DiskInventoryView } from './DiskInventoryView';
import { SongPlaylistView } from './SongPlaylistView';

export const FurniturePlaylistEditorWidgetView: FC<{}> = props =>
{
    const { objectId = -1, currentPlayingIndex = -1, playlist = null, diskInventory = null, onClose = null, togglePlayPause = null, removeFromPlaylist = null, addToPlaylist = null } = useFurniturePlaylistEditorWidget();

    if(objectId === -1) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-playlist-editor"
            title={ LocalizeText('playlist.editor.title') }
            subtitle={ LocalizeText('playlist.editor.playlist') }
            icon={ Music2 }
            onClose={ onClose }
            widthClassName="w-[680px]"
            bodyClassName="grid h-[420px] grid-cols-2 gap-4 !overflow-hidden"
        >
            <div className="min-h-0 overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 shadow-regular-xs">
                <DiskInventoryView addToPlaylist={ addToPlaylist } diskInventory={ diskInventory } />
            </div>
            <div className="min-h-0 overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 shadow-regular-xs">
                <SongPlaylistView furniId={ objectId } removeFromPlaylist={ removeFromPlaylist } playlist={ playlist } togglePlayPause={ togglePlayPause } currentPlayingIndex={ currentPlayingIndex } />
            </div>
        </FurnitureWidgetWindow>
    );
}
