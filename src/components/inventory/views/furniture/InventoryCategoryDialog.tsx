import { FC, useCallback, useEffect, useState } from 'react';
import { useInventoryCategories } from '../../../../hooks/inventory/useInventoryCategories';

const AUTO_FILTER_OPTIONS = [
    { value: '', label: 'Manuell' },
    { value: 'wall', label: 'Wand-Items' },
    { value: 'floor', label: 'Boden-Items' },
    { value: 'wired', label: 'Wireds' },
    { value: 'wallpaper', label: 'Tapeten' },
    { value: 'poster', label: 'Poster' },
    { value: 'trophy', label: 'Trophaeen' },
    { value: 'guild', label: 'Gruppenmöbel' },
    { value: 'rare', label: 'Raritaeten' },
];

interface InventoryCategoryDialogProps
{
    editId: number | null;
    onClose: () => void;
}

export const InventoryCategoryDialog: FC<InventoryCategoryDialogProps> = ({ editId, onClose }) =>
{
    const { categories, createCategory, renameCategory, setCategoryColor, COLORS } = useInventoryCategories();
    const [ name, setName ] = useState('');
    const [ color, setColor ] = useState(COLORS[0]);
    const [ autoFilter, setAutoFilter ] = useState('');
    const [ saving, setSaving ] = useState(false);

    useEffect(() =>
    {
        if(editId)
        {
            const cat = categories.find(c => c.id === editId);

            if(cat)
            {
                setName(cat.name);
                setColor(cat.color);
                setAutoFilter(cat.autoFilter || '');
            }
        }
    }, [ editId, categories ]);

    const onSave = useCallback(() =>
    {
        const trimmed = name.trim();

        if(!trimmed || trimmed.length < 1 || saving) return;

        setSaving(true);

        if(editId)
        {
            renameCategory(editId, trimmed);
            setCategoryColor(editId, color);
        }
        else
        {
            createCategory(trimmed, color, autoFilter || null);
        }

        setSaving(false);
        onClose();
    }, [ name, color, autoFilter, editId, saving, createCategory, renameCategory, setCategoryColor, onClose ]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) =>
    {
        if(e.key === 'Enter') onSave();
        if(e.key === 'Escape') onClose();
    }, [ onSave, onClose ]);

    return (
        <div className="inv-category-dialog-overlay" onClick={ onClose }>
            <div className="inv-category-dialog" onClick={ (e) => e.stopPropagation() }>
                <div className="dialog-title">{ editId ? 'Kategorie bearbeiten' : 'Neue Kategorie' }</div>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Name..."
                    value={ name }
                    onChange={ (e) => setName(e.target.value) }
                    onKeyDown={ onKeyDown }
                    maxLength={ 30 }
                    autoFocus
                />
                { !editId && (
                    <select
                        className="dialog-filter-select"
                        value={ autoFilter }
                        onChange={ (e) => setAutoFilter(e.target.value) }
                    >
                        { AUTO_FILTER_OPTIONS.map(opt => (
                            <option key={ opt.value } value={ opt.value }>{ opt.label }</option>
                        )) }
                    </select>
                ) }
                <div className="color-picker">
                    { COLORS.map(c => (
                        <div
                            key={ c }
                            className={ 'color-swatch' + (color === c ? ' active' : '') }
                            style={{ backgroundColor: c }}
                            onClick={ () => setColor(c) }
                        />
                    )) }
                </div>
                <div className="dialog-actions">
                    <button className="btn btn-sm btn-secondary" onClick={ onClose }>Abbrechen</button>
                    <button
                        className="btn btn-sm btn-success"
                        onClick={ onSave }
                        disabled={ !name.trim() || saving }
                    >
                        { saving ? '...' : (editId ? 'Speichern' : 'Erstellen') }
                    </button>
                </div>
            </div>
        </div>
    );
};
