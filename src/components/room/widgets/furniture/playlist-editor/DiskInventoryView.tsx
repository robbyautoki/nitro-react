import { IAdvancedMap, MusicPriorities } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useCallback, useEffect, useState } from 'react';
import { Music, Pause, Play, Plus, ShoppingBag } from 'lucide-react';
import { CatalogPageName, CreateLinkEvent, GetDiskColor, GetNitroInstance, LocalizeText } from '../../../../../api';
import { Base } from '../../../../../common';
import * as AlignButton from '@/align-ui/components/ui/button';
import { cn } from '@/align-ui/utils/cn';

export interface DiskInventoryViewProps
{
    diskInventory: IAdvancedMap<number, number>;
    addToPlaylist: (diskId: number, slotNumber: number) => void;
}

export const DiskInventoryView: FC<DiskInventoryViewProps> = props =>
{
    const { diskInventory = null, addToPlaylist = null } = props;
    const [ selectedItem, setSelectedItem ] = useState<number>(-1);
    const [ previewSongId, setPreviewSongId ] = useState<number>(-1);

    const previewSong = useCallback((event: MouseEvent, songId: number) =>
    {
        event.stopPropagation();

        setPreviewSongId(prevValue => (prevValue === songId) ? -1 : songId);
    }, []);

    const addSong = useCallback((event: MouseEvent, diskId: number) =>
    {
        event.stopPropagation();

        addToPlaylist(diskId, GetNitroInstance().soundManager.musicController?.getRoomItemPlaylist()?.length)
    }, [ addToPlaylist ]);

    const openCatalogPage = () =>
    {
        CreateLinkEvent('catalog/open/' + CatalogPageName.TRAX_SONGS);
    }

    useEffect(() =>
    {
        if(previewSongId === -1) return;

        GetNitroInstance().soundManager.musicController?.playSong(previewSongId, MusicPriorities.PRIORITY_SONG_PLAY, 0, 0, 0, 0);

        return () =>
        {
            GetNitroInstance().soundManager.musicController?.stop(MusicPriorities.PRIORITY_SONG_PLAY);
        }
    }, [ previewSongId ]);

    useEffect(() =>
    {
        return () => setPreviewSongId(-1);
    }, []);

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-success-lighter text-success-base">
                    <Music className="size-4" />
                </span>
                <div className="min-w-0">
                    <div className="truncate text-label-sm text-text-strong-950">{ LocalizeText('playlist.editor.my.music') }</div>
                    <div className="truncate text-paragraph-xs text-text-sub-600">{ LocalizeText('playlist.editor.text.get.more.music') }</div>
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-2">
                    { diskInventory && diskInventory.getKeys().map((key, index) =>
                    {
                        const diskId = diskInventory.getKey(index);
                        const songId = diskInventory.getWithIndex(index);
                        const songInfo = GetNitroInstance().soundManager.musicController?.getSongInfo(songId);
                        const isSelected = selectedItem === index;

                        return (
                            <div
                                key={ index }
                                className={ cn('relative flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-2 transition duration-200 ease-out', isSelected ? 'border-primary-base bg-primary-alpha-10' : 'border-stroke-soft-200 bg-bg-white-0 hover:bg-bg-weak-50') }
                                onClick={ () => setSelectedItem(prev => prev === index ? -1 : index) }
                            >
                                <Base className="disk-image shrink-0" style={ { backgroundColor: GetDiskColor(songInfo?.songData) } } />
                                <div className="w-full truncate text-center text-subheading-2xs text-text-strong-950">{ songInfo?.name }</div>
                                { isSelected &&
                                    <div className="absolute inset-x-2 bottom-2 grid grid-cols-2 gap-1">
                                        <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" onClick={ event => previewSong(event, songId) }>
                                            <AlignButton.Icon as={ (previewSongId === songId) ? Pause : Play } className="size-3.5" />
                                        </AlignButton.Root>
                                        <AlignButton.Root variant="primary" mode="filled" size="xxsmall" onClick={ event => addSong(event, diskId) }>
                                            <AlignButton.Icon as={ Plus } className="size-3.5" />
                                        </AlignButton.Root>
                                    </div> }
                            </div>
                        );
                    }) }
                </div>
            </div>
            <div className="rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200">
                <div className="text-label-sm text-text-strong-950">{ LocalizeText('playlist.editor.text.get.more.music') }</div>
                <div className="mt-1 text-paragraph-xs text-text-sub-600">{ LocalizeText('playlist.editor.text.you.can.buy.some.from.the.catalogue') }</div>
                <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" className="mt-3 w-full" onClick={ openCatalogPage }>
                    <AlignButton.Icon as={ ShoppingBag } className="size-4" />
                    { LocalizeText('playlist.editor.button.open.catalogue') }
                </AlignButton.Root>
            </div>
        </div>
    );
}
