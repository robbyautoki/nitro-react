import { FC, useEffect, useMemo, useState } from 'react';
import { RoomObjectCategory, RoomObjectType } from '@nitrots/nitro-renderer';
import { GetConfiguration, GetRoomEngine, GetRoomSession, WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

const AI_MODELS = [
    { value: 0, label: 'gpt-4o-mini (schnell & guenstig)' },
    { value: 1, label: 'gpt-4o (stark)' },
    { value: 2, label: 'gpt-4.1-mini (schnell & schlau)' },
    { value: 3, label: 'gpt-4.1 (staerkstes Modell)' },
];

export const WiredActionAiMessageView: FC<{}> = props =>
{
    const [ botName, setBotName ] = useState('');
    const [ systemPrompt, setSystemPrompt ] = useState('');
    const [ modelIndex, setModelIndex ] = useState(0);
    const [ description, setDescription ] = useState('');
    const [ generating, setGenerating ] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const roomBots = useMemo(() =>
    {
        try
        {
            const roomSession = GetRoomSession();
            if (!roomSession) return [];

            const roomObjects = GetRoomEngine().getRoomObjects(roomSession.roomId, RoomObjectCategory.UNIT);
            const bots: string[] = [];

            for (const roomObject of roomObjects)
            {
                const userData = roomSession.userDataManager.getUserDataByIndex(roomObject.id);
                if (userData && (userData.type === RoomObjectType.BOT || userData.type === RoomObjectType.RENTABLE_BOT))
                {
                    bots.push(userData.name);
                }
            }

            return bots;
        }
        catch (e)
        {
            return [];
        }
    }, []);

    const save = () =>
    {
        setIntParams([ modelIndex ]);
        setStringParam(botName + '\t' + systemPrompt);
    }

    const generatePrompt = async () =>
    {
        if (!description.trim()) return;

        setGenerating(true);
        try
        {
            const cmsUrl = GetConfiguration<string>('url.prefix', '');
            const res = await fetch(`${ cmsUrl }/api/ai/generate-prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ description: description.trim() })
            });
            const data = await res.json();
            if (data.prompt) setSystemPrompt(data.prompt);
        }
        catch (e)
        {
            console.error('Prompt generation failed', e);
        }
        setGenerating(false);
    };

    useEffect(() =>
    {
        setModelIndex((trigger.intData.length > 0) ? trigger.intData[0] : 0);

        const raw = trigger.stringData || '';
        const tabIndex = raw.indexOf('\t');
        if (tabIndex >= 0)
        {
            setBotName(raw.substring(0, tabIndex));
            setSystemPrompt(raw.substring(tabIndex + 1));
        }
        else
        {
            setBotName('');
            setSystemPrompt(raw);
        }
    }, [ trigger ]);

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Text bold>Bot im Raum</Text>
                <select
                    className="form-select form-select-sm"
                    value={ botName }
                    onChange={ event => setBotName(event.target.value) }>
                    <option value="">-- Kein Bot (Whisper) --</option>
                    { roomBots.map((name, i) => (
                        <option key={ i } value={ name }>{ name }</option>
                    )) }
                </select>
            </Column>
            <Column gap={ 1 }>
                <Text bold>AI Model</Text>
                <select
                    className="form-select form-select-sm"
                    value={ modelIndex }
                    onChange={ event => setModelIndex(parseInt(event.target.value)) }>
                    { AI_MODELS.map(m => (
                        <option key={ m.value } value={ m.value }>{ m.label }</option>
                    )) }
                </select>
            </Column>
            <Column gap={ 1 }>
                <Text bold>Prompt mit AI generieren</Text>
                <div className="d-flex gap-1">
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={ description }
                        onChange={ e => setDescription(e.target.value) }
                        placeholder="z.B. Tuersteher fuer VIP Bereich"
                        disabled={ generating } />
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={ generatePrompt }
                        disabled={ generating || !description.trim() }>
                        { generating ? '...' : 'AI' }
                    </button>
                </div>
            </Column>
            <Column gap={ 1 }>
                <Text bold>System Prompt (Rolle)</Text>
                <textarea
                    className="form-control form-control-sm"
                    value={ systemPrompt }
                    onChange={ event => setSystemPrompt(event.target.value) }
                    maxLength={ 500 }
                    rows={ 4 }
                    placeholder="z.B. Du bist ein Tuersteher. Passwort ist 'Habbo2024'. Richtig → [1]. Falsch → [2]." />
            </Column>
            <Column gap={ 1 }>
                <Text small className="text-muted">
                    Waehle Wired-Effekte im Raum als Aktionen. Nutze [1], [2], etc. im Prompt fuer AI-gesteuerte Entscheidungen.
                </Text>
            </Column>
        </WiredActionBaseView>
    );
}
