import { FC } from 'react';
import { BANNER_PRESETS, BannerPreset } from '../BannerPresets';

interface BannerPickerViewProps
{
    activeBannerId: string;
    onSelect: (preset: BannerPreset) => void;
    onClose: () => void;
}

export const BannerPickerView: FC<BannerPickerViewProps> = props =>
{
    const { activeBannerId, onSelect, onClose } = props;

    return (
        <div className="banner-picker">
            <div className="banner-picker-header">
                <span>Banner auswaehlen</span>
                <button className="banner-picker-close" onClick={ onClose }>&times;</button>
            </div>
            <div className="banner-picker-grid">
                { BANNER_PRESETS.map(preset => (
                    <div
                        key={ preset.id }
                        className={ `banner-picker-item ${ activeBannerId === preset.id ? 'active' : '' }` }
                        style={ preset.gifUrl
                            ? { backgroundImage: `url(${ preset.gifUrl })`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: preset.gradient }
                        }
                        onClick={ () => onSelect(preset) }
                        title={ preset.name }
                    >
                        <span className="banner-picker-name">{ preset.name }</span>
                    </div>
                )) }
            </div>
        </div>
    );
}
