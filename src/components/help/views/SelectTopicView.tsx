import { FC, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { LocalizeText, ReportState } from '../../../api';
import { useHelp, useModTools } from '../../../hooks';

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
            <div>
                <p className="text-xs text-white/40 mb-3">
                    { selectedCategory < 0 ? 'Waehle eine Kategorie' : 'Waehle ein Thema' }
                </p>
            </div>

            { selectedCategory >= 0 && (
                <button
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-2"
                    onClick={ () => { setSelectedCategory(-1); setSelectedTopic(-1); } }
                >
                    <ChevronLeft className="size-3.5" />
                    Zurueck zu Kategorien
                </button>
            ) }

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                { selectedCategory < 0 && cfhCategories.map((category, index) => (
                    <button
                        key={ index }
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-left text-sm text-white/70 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all"
                        onClick={ () => setSelectedCategory(index) }
                    >
                        <span>{ LocalizeText(`help.cfh.reason.${ category.name }`) }</span>
                        <ChevronRight className="size-4 text-white/30" />
                    </button>
                )) }

                { selectedCategory >= 0 && cfhCategories[selectedCategory].topics.map((topic, index) => (
                    <button
                        key={ index }
                        className={ `w-full px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all ${
                            selectedTopic === index
                                ? 'border-blue-500/30 bg-blue-500/10 text-white/90'
                                : 'border-white/[0.06] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:border-white/[0.1]'
                        }` }
                        onClick={ () => setSelectedTopic(index) }
                    >
                        { LocalizeText(`help.cfh.topic.${ topic.id }`) }
                    </button>
                )) }
            </div>

            { selectedCategory >= 0 && (
                <div className="flex justify-end pt-2">
                    <button
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={ selectedTopic < 0 }
                        onClick={ submitTopic }
                    >
                        Weiter
                    </button>
                </div>
            ) }
        </div>
    );
};
