import { useCallback, useMemo, useRef, useState } from 'react';

export const useSharedVisibility = () =>
{
    const [ activeIds, setActiveIds ] = useState<number[]>([]);
    const nextId = useRef(0);

    const isVisible = useMemo(() => !!activeIds.length, [ activeIds ]);

    const activate = useCallback(() =>
    {
        const id = nextId.current++;

        setActiveIds(prevValue => [ ...prevValue, id ]);

        return id;
    }, []);

    const deactivate = useCallback((id: number) =>
    {
        setActiveIds(prevValue =>
        {
            const newValue = [ ...prevValue ];

            const index = newValue.indexOf(id);

            if(index === -1) return prevValue;

            newValue.splice(index, 1);

            return newValue;
        });
    }, []);

    return { isVisible, activate, deactivate };
}
