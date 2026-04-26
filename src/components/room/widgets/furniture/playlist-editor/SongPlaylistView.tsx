import { ISongInfo } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { Music2, Pause, Play, Trash2 } from 'lucide-react';
import { GetDiskColor, LocalizeText } from '../../../../../api';
import { Base } from '../../../../../common';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { cn } from '@/align-ui/utils/cn';

export interface SongPlaylistViewProps
{
    furniId: number;
    playlist: ISongInfo[];
    currentPlayingIndex: number;
    removeFromPlaylist(slotNumber: number): void;
    togglePlayPause(furniId: number, position: number): void;
}

export const SongPlaylistView: FC<SongPlaylistViewProps> = props =>
{
    const { furniId = -1, playlist = null, currentPlayingIndex = -1, removeFromPlaylist = null, togglePlayPause = null } = props;
    const [ selectedItem, setSelectedItem ] = useState<number>(-1);

    const playPause = (furniId: number, selectedItem: number) =>
    {
        togglePlayPause(furniId, selectedItem !== -1 ? selectedItem : 0 )
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-information-lighter text-information-base">
                    <Music2 className="size-4" />
                </span>
                <div className="min-w-0">
                    <div className="truncate text-label-sm text-text-strong-950">{ LocalizeText('playlist.editor.playlist') }</div>
                    <div className="truncate text-paragraph-xs text-text-sub-600">{ LocalizeText('playlist.editor.text.click.song.to.choose.click.again.to.move') }</div>
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                { (!playlist || playlist.length === 0) &&
                    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-stroke-soft-200 bg-bg-weak-50 p-4 text-center">
                        <Music2 className="mb-2 size-6 text-text-soft-400" />
                        <div className="text-label-sm text-text-strong-950">{ LocalizeText('playlist.editor.add.songs.to.your.playlist') }</div>
                        <div className="mt-1 text-paragraph-xs text-text-sub-600">{ LocalizeText('playlist.editor.text.click.song.to.choose.click.again.to.move') }</div>
                    </div> }
                { playlist && playlist.length > 0 &&
                    <div className="flex flex-col gap-2">
                        { playlist.map((songInfo, index) =>
                        {
                            const isSelected = selectedItem === index;
                            const isPlaying = currentPlayingIndex === index;

                            return (
                                <div
                                    key={ index }
                                    className={ cn('flex cursor-pointer items-center gap-3 rounded-xl border p-2 transition duration-200 ease-out', isSelected ? 'border-primary-base bg-primary-alpha-10' : 'border-stroke-soft-200 bg-bg-white-0 hover:bg-bg-weak-50') }
                                    onClick={ () => setSelectedItem(prev => prev === index ? -1 : index) }
                                >
                                    <Base className={ 'disk-2 ' + (isPlaying ? 'playing-song' : '') } style={ { backgroundColor: isPlaying ? undefined : GetDiskColor(songInfo.songData) } } />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-label-sm text-text-strong-950">{ songInfo.name }</div>
                                        <div className="truncate text-paragraph-xs text-text-sub-600">{ songInfo.creator }</div>
                                    </div>
                                    { isSelected &&
                                        <AlignButton.Root variant="error" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ event => { event.stopPropagation(); removeFromPlaylist(index); } }>
                                            <AlignButton.Icon as={ Trash2 } className="size-4" />
                                        </AlignButton.Root> }
                                </div>
                            );
                        }) }
                    </div> }
            </div>
            { (playlist && playlist.length > 0) &&
                <div className="rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200">
                    { (currentPlayingIndex === -1) &&
                        <FancyButton.Root variant="primary" size="small" className="w-full" onClick={ () => playPause(furniId, selectedItem) }>
                            <FancyButton.Icon as={ Play } />
                            { LocalizeText('playlist.editor.button.play.now') }
                        </FancyButton.Root> }
                    { (currentPlayingIndex !== -1) &&
                        <div className="flex items-center gap-3">
                            <AlignButton.Root variant="error" mode="filled" size="small" className="size-9 p-0" onClick={ () => playPause(furniId, selectedItem) }>
                                <AlignButton.Icon as={ Pause } className="size-4" />
                            </AlignButton.Root>
                            <div className="min-w-0">
                                <div className="truncate text-label-sm text-text-strong-950">{ LocalizeText('playlist.editor.text.now.playing.in.your.room') }</div>
                                <div className="truncate text-paragraph-xs text-text-sub-600">
                                    { playlist[currentPlayingIndex]?.name + ' - ' + playlist[currentPlayingIndex]?.creator }
                                </div>
                            </div>
                        </div> }
                </div> }
        </div>
    );
}
