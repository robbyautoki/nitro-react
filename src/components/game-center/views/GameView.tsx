import { Game2GetAccountGameStatusMessageComposer, GetGameStatusMessageComposer, JoinQueueMessageComposer } from '@nitrots/nitro-renderer';
import { useEffect } from 'react';
import { ColorUtils, LocalizeText, SendMessageComposer } from '../../../api';
import { Base, Button, Flex, LayoutItemCountView, Text } from '../../../common';
import { useGameCenter } from '../../../hooks';

export const GameView = () => 
{
    const { selectedGame, accountStatus } = useGameCenter();

    useEffect(()=>
    {
        if(selectedGame) 
        {
            SendMessageComposer(new GetGameStatusMessageComposer(selectedGame.gameId));
            SendMessageComposer(new Game2GetAccountGameStatusMessageComposer(selectedGame.gameId));
        }
    },[ selectedGame ])

    const getBgColour = (): string => 
    {
        return ColorUtils.uintHexColor(selectedGame.bgColor)
    }

    const getBgImage = (): string => 
    {
        return `url(${ selectedGame.assetUrl }${ selectedGame.gameNameId }_theme.png)`
    }

    const getColor = () => 
    {
        return ColorUtils.uintHexColor(selectedGame.textColor);
    }

    const onPlay = () => 
    {
        SendMessageComposer(new JoinQueueMessageComposer(selectedGame.gameId));
    }

    return <Flex className="game-view py-4" fullHeight style={ { backgroundColor: getBgColour(), backgroundImage: getBgImage(), color: getColor() } }>
        <Flex className="w-3/4" column alignItems="center" gap={ 2 }>
            <Text bold>{ LocalizeText(`gamecenter.${ selectedGame.gameNameId }.description_title`) }</Text>
            <img src={ selectedGame.assetUrl + selectedGame.gameNameId + '_logo.png' }/>
            { (accountStatus.hasUnlimitedGames || accountStatus.freeGamesLeft > 0) && <>
                <Button variant="light" position="relative" className="px-4" onClick={ onPlay }>
                    { LocalizeText('gamecenter.play_now') }
                    { !accountStatus.hasUnlimitedGames && 
                    <LayoutItemCountView className="-mr-1 -mt-1" count={ accountStatus.freeGamesLeft }/> }
                </Button>
            </> }
            <Text bold className="w-1/2" center>{ LocalizeText(`gamecenter.${ selectedGame.gameNameId }.description_content`) }</Text>
        </Flex>
        <Base className="w-1/4">

        </Base>
        
    </Flex>
}
