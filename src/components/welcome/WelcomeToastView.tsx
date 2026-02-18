import { FC, useEffect, useState } from 'react';
import { useSessionInfo } from '../../hooks';

export const WelcomeToastView: FC<{}> = props =>
{
    const { userInfo = null } = useSessionInfo();
    const [ visible, setVisible ] = useState(false);
    const [ fading, setFading ] = useState(false);

    useEffect(() =>
    {
        if(!userInfo) return;

        const showTimer = setTimeout(() => setVisible(true), 1500);

        return () => clearTimeout(showTimer);
    }, [ userInfo ]);

    useEffect(() =>
    {
        if(!visible) return;

        const fadeTimer = setTimeout(() =>
        {
            setFading(true);

            setTimeout(() => setVisible(false), 600);
        }, 5000);

        return () => clearTimeout(fadeTimer);
    }, [ visible ]);

    if(!visible || !userInfo) return null;

    return (
        <div className={ `fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-all duration-500 ${ fading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0' }` }>
            <div className="px-6 py-3 rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/[0.08] shadow-lg">
                <p className="text-sm text-white/90 font-medium tracking-wide">
                    Willkommen zurück, <span className="text-amber-300 font-bold">{ userInfo.username }</span>!
                </p>
            </div>
        </div>
    );
}
