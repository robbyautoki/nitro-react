import { FC, useEffect, useState } from 'react';
import { ListVideo, SkipBack, SkipForward, Youtube } from 'lucide-react';
import YouTube, { Options } from 'react-youtube';
import { YouTubePlayer } from 'youtube-player/dist/types';
import { LocalizeText, YoutubeVideoPlaybackStateEnum } from '../../../../api';
import { useFurnitureYoutubeWidget } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import { cn } from '@/align-ui/utils/cn';
import { FurnitureWidgetSection, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

export const FurnitureYoutubeDisplayView: FC<{}> = FurnitureYoutubeDisplayViewProps =>
{
    const [ player, setPlayer ] = useState<any>(null);
    const { objectId = -1, videoId = null, videoStart = 0, videoEnd = 0, currentVideoState = null, selectedVideo = null, playlists = [], onClose = null, previous = null, next = null, pause = null, play = null, selectVideo = null } = useFurnitureYoutubeWidget();

    const onStateChange = (event: { target: YouTubePlayer; data: number }) =>
    {
        setPlayer(event.target);

        if(objectId === -1) return;
        
        switch(event.target.getPlayerState())
        {
            case -1:
            case 1:
                if(currentVideoState === 2)
                {
                //event.target.pauseVideo();
                }

                if(currentVideoState !== 1) play();
                return;
            case 2:
                if(currentVideoState !== 2) pause();
        }
    }

    useEffect(() =>
    {
        if((currentVideoState === null) || !player) return;

        if((currentVideoState === YoutubeVideoPlaybackStateEnum.PLAYING) && (player.getPlayerState() !== YoutubeVideoPlaybackStateEnum.PLAYING))
        {
            player.playVideo();

            return;
        }

        if((currentVideoState === YoutubeVideoPlaybackStateEnum.PAUSED) && (player.getPlayerState() !== YoutubeVideoPlaybackStateEnum.PAUSED))
        {
            player.pauseVideo();

            return;
        }
    }, [ currentVideoState, player ]);

    if(objectId === -1) return null;

    const youtubeOptions: Options = {
        height: '360',
        width: '520',
        playerVars: {
            autoplay: 1,
            disablekb: 1,
            controls: 0,
            origin: window.origin,
            modestbranding: 1,
            start: videoStart,
            end: videoEnd
        }
    }

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-youtube"
            title={ LocalizeText('catalog.page.youtube_tvs') }
            subtitle={ LocalizeText('widget.furni.video_viewer.playlists') }
            icon={ Youtube }
            onClose={ onClose }
            widthClassName="w-[760px]"
            bodyClassName="grid max-h-[520px] grid-cols-[1fr_190px] gap-4 !overflow-hidden"
        >
            <FurnitureWidgetSection className="min-h-[360px] overflow-hidden p-2">
                <div className="youtube-video-container h-full overflow-hidden rounded-xl bg-bg-strong-950">
                    { (videoId && videoId.length > 0) &&
                        <YouTube videoId={ videoId } opts={ youtubeOptions } onReady={ event => setPlayer(event.target) } onStateChange={ onStateChange } containerClassName={ 'youtubeContainer' } />
                    }
                    { (!videoId || videoId.length === 0) &&
                        <div className="flex h-full w-full items-center justify-center px-4 text-center text-paragraph-sm text-text-white-0">{ LocalizeText('widget.furni.video_viewer.no_videos') }</div>
                    }
                </div>
            </FurnitureWidgetSection>
            <FurnitureWidgetSection title={ LocalizeText('widget.furni.video_viewer.playlists') } className="min-h-0 overflow-hidden">
                <div className="mb-3 grid grid-cols-2 gap-2">
                    <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" onClick={ previous }>
                        <AlignButton.Icon as={ SkipBack } className="size-4" />
                    </AlignButton.Root>
                    <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" onClick={ next }>
                        <AlignButton.Icon as={ SkipForward } className="size-4" />
                    </AlignButton.Root>
                </div>
                <div className="flex max-h-[304px] flex-col gap-2 overflow-auto pr-1">
                    { playlists && playlists.map((entry, index) => (
                        <button
                            type="button"
                            key={ index }
                            className={ cn('flex min-h-16 items-center gap-2 rounded-xl border p-3 text-left transition duration-200 ease-out', (entry.video === selectedVideo) ? 'border-primary-base bg-primary-alpha-10' : 'border-stroke-soft-200 bg-bg-white-0 hover:bg-bg-weak-50') }
                            onClick={ event => selectVideo(entry.video) }
                        >
                            <ListVideo className="size-4 shrink-0 text-text-sub-600" />
                            <span className="line-clamp-2 text-paragraph-xs text-text-strong-950">{ entry.title }</span>
                        </button>
                    )) }
                </div>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    )
}
