import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTrash } from 'react-icons/fa';
import { GroupItem } from '../../../../api';

interface InventoryDeleteDialogProps
{
    groupItem: GroupItem;
    maxCount: number;
    onConfirm: (itemIds: number[]) => void;
    onClose: () => void;
}

export const InventoryDeleteDialog: FC<InventoryDeleteDialogProps> = ({ groupItem, maxCount, onConfirm, onClose }) =>
{
    const [ count, setCount ] = useState(1);

    const onSubmit = useCallback(() =>
    {
        const items = groupItem.items.filter(i => !i.locked);
        const toDelete = items.slice(0, count).map(i => i.id);

        if(toDelete.length > 0) onConfirm(toDelete);
    }, [ groupItem, count, onConfirm ]);

    return createPortal(
        <div className="inv-delete-overlay" onClick={ onClose }>
            <div className="inv-delete-dialog" onClick={ e => e.stopPropagation() }>
                <div className="inv-delete-header">
                    <FaTrash style={{ color: '#ef4444' }} />
                    <span>Möbel löschen</span>
                </div>
                <div className="inv-delete-body">
                    <div className="inv-delete-item-name">{ groupItem.name }</div>
                    { maxCount > 1 && (
                        <>
                            <div className="inv-delete-label">
                                Wie viele löschen? <span style={{ opacity: 0.6 }}>(du besitzt: { maxCount } Stück)</span>
                            </div>
                            <div className="inv-delete-input-row">
                                <button
                                    className="inv-delete-btn"
                                    onClick={ () => setCount(Math.max(1, count - 1)) }
                                    disabled={ count <= 1 }
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    className="inv-delete-input"
                                    value={ count }
                                    min={ 1 }
                                    max={ maxCount }
                                    onChange={ e => {
                                        const val = parseInt(e.target.value) || 1;
                                        setCount(Math.max(1, Math.min(maxCount, val)));
                                    } }
                                />
                                <button
                                    className="inv-delete-btn"
                                    onClick={ () => setCount(Math.min(maxCount, count + 1)) }
                                    disabled={ count >= maxCount }
                                >
                                    +
                                </button>
                                <button
                                    className="inv-delete-btn"
                                    onClick={ () => setCount(maxCount) }
                                    style={{ fontSize: '10px', minWidth: '36px' }}
                                >
                                    Alle
                                </button>
                            </div>
                            <input
                                type="range"
                                className="inv-delete-slider"
                                min={ 1 }
                                max={ maxCount }
                                value={ count }
                                onChange={ e => setCount(parseInt(e.target.value)) }
                            />
                            <div style={{ textAlign: 'center', fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>
                                { count } von { maxCount } löschen
                            </div>
                        </>
                    ) }
                    { maxCount === 1 && (
                        <div className="inv-delete-label">
                            Dieses Möbelstück unwiderruflich löschen?
                        </div>
                    ) }
                </div>
                <div className="inv-delete-footer">
                    <button className="inv-delete-cancel" onClick={ onClose }>Abbrechen</button>
                    <button className="inv-delete-confirm" onClick={ onSubmit }>
                        { count > 1 ? `${ count } Stück löschen` : 'Löschen' }
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
