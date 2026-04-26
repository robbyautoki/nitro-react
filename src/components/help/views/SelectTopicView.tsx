import { FC, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { LocalizeText, ReportState } from '../../../api';
import { useHelp, useModTools } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';

export const SelectTopicView: FC<{}> = () =>
{
    const [ selectedCategory, setSelectedCategory ] = useState(-1);
    const [ selectedTopic, setSelectedTopic ] = useState(-1);
    const { setActiveReport = null } = useHelp();
    const { cfhCategories = [] } = useModTools();

    const submitTopic = () =>
    {
        if(selectedCategory < 0 || selectedTopic < 0) return;

        setActiveReport(prev => ({
            ...prev,
            cfhCategory: selectedCategory,
            cfhTopic: cfhCategories[selectedCategory].topics[selectedTopic].id,
            currentStep: ReportState.INPUT_REPORT_MESSAGE,
        }));
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-bg-weak-50 px-4 py-3 ring-1 ring-inset ring-stroke-soft-200">
                <p className="text-label-sm text-text-strong-950">
                    { selectedCategory < 0 ? 'Waehle eine Kategorie' : 'Waehle ein Thema' }
                </p>
                <p className="mt-1 text-paragraph-xs text-text-sub-600">Ordne deine Meldung ein, damit sie richtig bearbeitet wird.</p>
            </div>
            { selectedCategory >= 0 && (
                <AlignButton.Root
                    type="button"
                    variant="neutral"
                    mode="ghost"
                    size="xxsmall"
                    className="mb-2"
                    onClick={ () =>
                    {
                        setSelectedCategory(-1);
                        setSelectedTopic(-1);
                    } }
                >
                    <AlignButton.Icon as={ ChevronLeft } className="size-3.5" />
                    Zurueck zu Kategorien
                </AlignButton.Root>
            ) }
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                { selectedCategory < 0 && cfhCategories.map((category, index) => (
                    <AlignButton.Root
                        key={ index }
                        type="button"
                        variant="neutral"
                        mode="stroke"
                        size="medium"
                        className="h-auto w-full justify-between whitespace-normal px-3.5 py-2.5 text-left"
                        onClick={ () => setSelectedCategory(index) }
                    >
                        <span>{ LocalizeText(`help.cfh.reason.${ category.name }`) }</span>
                        <AlignButton.Icon as={ ChevronRight } className="size-4 text-text-soft-400" />
                    </AlignButton.Root>
                )) }
                { selectedCategory >= 0 && cfhCategories[selectedCategory].topics.map((topic, index) => (
                    <AlignButton.Root
                        key={ index }
                        type="button"
                        variant={ selectedTopic === index ? 'primary' : 'neutral' }
                        mode={ selectedTopic === index ? 'lighter' : 'stroke' }
                        size="medium"
                        className="h-auto w-full justify-start whitespace-normal px-3.5 py-2.5 text-left"
                        onClick={ () => setSelectedTopic(index) }
                    >
                        { LocalizeText(`help.cfh.topic.${ topic.id }`) }
                    </AlignButton.Root>
                )) }
            </div>
            { selectedCategory >= 0 && (
                <div className="flex justify-end pt-2">
                    <AlignButton.Root
                        type="button"
                        variant="primary"
                        mode="filled"
                        size="small"
                        disabled={ selectedTopic < 0 }
                        onClick={ submitTopic }
                    >
                        Weiter
                    </AlignButton.Root>
                </div>
            ) }
        </div>
    );
};
