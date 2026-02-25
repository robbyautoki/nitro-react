import { FC } from 'react';
import { X } from 'lucide-react';
import { BANNER_PRESETS, BannerPreset } from '../BannerPresets';

interface BannerPickerViewProps
{
    activeBannerId: string;
    onSelect: (preset: BannerPreset) => void;
    onClose: () => void;
}

export const BannerPickerView: FC<BannerPickerViewProps> = ({ activeBannerId, onSelect, onClose }) =>
{
    return (
        <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3">
            <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Banner auswählen</span>
                <button className="p-1 rounded-md hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors" onClick={ onClose }>
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
                { BANNER_PRESETS.map(preset => (
                    <button
                        key={ preset.id }
                        className={ `h-11 rounded-lg overflow-hidden border-2 transition-all flex items-end justify-center pb-1 ${
                            activeBannerId === preset.id
                                ? 'border-zinc-900 shadow-md'
                                : 'border-transparent hover:border-zinc-300 hover:scale-[1.03]'
                        }` }
                        style={ preset.gifUrl
                            ? { backgroundImage: `url(${ preset.gifUrl })`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: preset.gradient }
                        }
                        onClick={ () => onSelect(preset) }
                        title={ preset.name }
                    >
                        <span className="text-[9px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                            { preset.name }
                        </span>
                    </button>
                )) }
            </div>
        </div>
    );
};
