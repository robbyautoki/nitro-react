import { UpdateRoomFilterMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { RiFilter3Line } from '@remixicon/react';
import { SendMessageComposer } from '../../../../api';
import { useFilterWordsWidget, useNavigator } from '../../../../hooks';
import { cn } from '@/lib/utils';
import * as Modal from '@/align-ui/components/ui/modal';
import * as Input from '@/align-ui/components/ui/input';
import * as AlignButton from '@/align-ui/components/ui/button';

export const RoomFilterWordsWidgetView: FC<{}> = () =>
{
    const [ word, setWord ] = useState<string>('');
    const [ selectedWord, setSelectedWord ] = useState<string>('');
    const [ isSelectingWord, setIsSelectingWord ] = useState<boolean>(false);
    const { wordsFilter = [], isVisible = null, setWordsFilter, onClose = null } = useFilterWordsWidget();
    const { navigatorData = null } = useNavigator();

    const processAction = (isAddingWord: boolean) =>
    {
        const target = isSelectingWord ? selectedWord : word;
        if(!target || !target.trim()) return;
        if(!navigatorData?.enteredGuestRoom) return;

        SendMessageComposer(new UpdateRoomFilterMessageComposer(navigatorData.enteredGuestRoom.roomId, isAddingWord, target));
        setSelectedWord('');
        setWord('');
        setIsSelectingWord(false);

        if(isAddingWord && wordsFilter.includes(target)) return;

        setWordsFilter(prevValue =>
        {
            const newWords = [ ...prevValue ];
            isAddingWord ? newWords.push(target) : newWords.splice(newWords.indexOf(target), 1);
            return newWords;
        });
    }

    const onTyping = (value: string) =>
    {
        setWord(value);
        setIsSelectingWord(false);
    }

    const onSelectedWord = (value: string) =>
    {
        setSelectedWord(value);
        setIsSelectingWord(true);
    }

    const handleOpenChange = (open: boolean) =>
    {
        if(!open && onClose) onClose();
    }

    return (
        <Modal.Root open={ !!isVisible } onOpenChange={ handleOpenChange }>
            <Modal.Content className="max-w-[440px]">
                <Modal.Header
                    icon={ RiFilter3Line }
                    title="Raumfilter"
                    description="Verwalte verbotene Wörter für diesen Raum."
                />

                <Modal.Body className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Input.Root size="small" className="flex-1">
                            <Input.Wrapper>
                                <Input.Input
                                    maxLength={ 255 }
                                    value={ word }
                                    placeholder="Wort eingeben…"
                                    onChange={ event => onTyping(event.target.value) }
                                    onKeyDown={ event =>
                                    {
                                        if(event.key === 'Enter') processAction(true);
                                    } }
                                />
                            </Input.Wrapper>
                        </Input.Root>
                        <AlignButton.Root
                            variant="primary"
                            mode="filled"
                            size="xsmall"
                            onClick={ () => processAction(true) }
                            disabled={ !word.trim() }
                        >
                            Hinzufügen
                        </AlignButton.Root>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-sub-600">
                            Gefilterte Wörter
                        </div>
                        <div className="max-h-[180px] overflow-y-auto rounded-lg border border-stroke-soft-200 bg-bg-weak-50 p-1">
                            { wordsFilter && wordsFilter.length > 0 ? (
                                <div className="flex flex-col">
                                    { wordsFilter.map((value, index) => (
                                        <button
                                            key={ index }
                                            type="button"
                                            onClick={ () => onSelectedWord(value) }
                                            className={ cn(
                                                'flex w-full items-center rounded-md px-2 py-1.5 text-left text-paragraph-sm text-text-strong-950 transition-colors',
                                                selectedWord === value
                                                    ? 'bg-bg-white-0 shadow-regular-xs'
                                                    : 'hover:bg-bg-white-0/60'
                                            ) }
                                        >
                                            <span className="truncate">{ value }</span>
                                        </button>
                                    )) }
                                </div>
                            ) : (
                                <div className="flex items-center justify-center px-3 py-6 text-paragraph-sm text-text-soft-400">
                                    Noch keine Wörter gefiltert.
                                </div>
                            ) }
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <span className="text-paragraph-xs text-text-soft-400">
                        { wordsFilter?.length || 0 } Wörter
                    </span>
                    <AlignButton.Root
                        variant="error"
                        mode="filled"
                        size="xsmall"
                        onClick={ () => processAction(false) }
                        disabled={ !wordsFilter || wordsFilter.length === 0 || !isSelectingWord }
                    >
                        Entfernen
                    </AlignButton.Root>
                </Modal.Footer>
            </Modal.Content>
        </Modal.Root>
    );
};
