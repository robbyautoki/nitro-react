import { FC, useEffect, useRef, useState } from 'react';
import { RiSparklingLine } from '@remixicon/react';
import { useSessionInfo } from '../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCheckbox from '@/align-ui/components/ui/checkbox';
import * as Modal from '@/align-ui/components/ui/modal';

type WelcomeUpdate = {
    date: string;
    title: string;
    text: string;
    tag?: 'feature' | 'fix' | 'event';
};

const WELCOME_UPDATES: WelcomeUpdate[] = [
    {
        date: '2026-04-25',
        title: 'Avatar-Editor poliert',
        text: 'Item-Thumbnails und die Color-Palette laden jetzt zuverlässig — kein leeres Grid mehr beim Öffnen.',
        tag: 'fix'
    },
    {
        date: '2026-04-25',
        title: 'Welcome-Dialog',
        text: 'Neuer Begrüßungs-Dialog mit kompakter Update-Übersicht — direkt nach dem Betreten des ersten Raumes.',
        tag: 'feature'
    },
    {
        date: '2026-04-23',
        title: 'Counting-Channel ohne Reactions',
        text: 'Im Discord-Counting-Channel können keine Emoji-Reactions mehr gesetzt werden — sauberer Count-Flow.',
        tag: 'fix'
    },
    {
        date: '2026-04-22',
        title: 'Production live: bahhos.de',
        text: 'Der Hotel-Server läuft auf eigener Hostinger-Infrastruktur — schneller, stabiler, mit Caddy-SSL.',
        tag: 'event'
    }
];

const TAG_COLOR: Record<NonNullable<WelcomeUpdate['tag']>, 'blue' | 'orange' | 'green'> = {
    feature: 'blue',
    fix: 'orange',
    event: 'green'
};

const TAG_LABEL: Record<NonNullable<WelcomeUpdate['tag']>, string> = {
    feature: 'Neu',
    fix: 'Fix',
    event: 'Event'
};

const STORAGE_KEY = 'bahhos.welcome.lastSeen';
const LATEST_UPDATE_DATE = WELCOME_UPDATES[0].date;

export const WelcomeDialogView: FC<{}> = props =>
{
    const { userInfo = null } = useSessionInfo();
    const [ isOpen, setIsOpen ] = useState(false);
    const [ dontShowAgain, setDontShowAgain ] = useState(false);
    const hasShownRef = useRef(false);

    useEffect(() =>
    {
        if(!userInfo) return;
        if(hasShownRef.current) return;
        hasShownRef.current = true;

        try
        {
            const lastSeen = localStorage.getItem(STORAGE_KEY);
            if(lastSeen && lastSeen >= LATEST_UPDATE_DATE) return;
        }
        catch {}

        const t = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(t);
    }, [ userInfo ]);

    const handleOpenChange = (open: boolean) =>
    {
        if(!open && dontShowAgain)
        {
            try { localStorage.setItem(STORAGE_KEY, LATEST_UPDATE_DATE); } catch {}
        }
        setIsOpen(open);
    };

    if(!userInfo) return null;

    return (
        <Modal.Root open={ isOpen } onOpenChange={ handleOpenChange }>
            <Modal.Content className="max-w-[440px]">
                <Modal.Header
                    icon={ RiSparklingLine }
                    title="Willkommen zurück"
                    description={ `Schön, dass du wieder da bist, ${ userInfo.username }.` }
                />

                <Modal.Body className="flex max-h-[420px] flex-col gap-4 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-sub-600">
                            Letzte Updates
                        </div>
                        <div className="flex flex-col divide-y divide-stroke-soft-200">
                            { WELCOME_UPDATES.map((update, idx) => (
                                <div
                                    key={ idx }
                                    className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-2">
                                        { update.tag && (
                                            <AlignBadge.Root color={ TAG_COLOR[update.tag] } variant="lighter" size="small">
                                                { TAG_LABEL[update.tag] }
                                            </AlignBadge.Root>
                                        ) }
                                        <span className="text-label-sm font-semibold text-text-strong-950">
                                            { update.title }
                                        </span>
                                        <div className="flex-1" />
                                        <span className="text-paragraph-xs text-text-soft-400">
                                            { update.date }
                                        </span>
                                    </div>
                                    <div className="text-paragraph-sm text-text-sub-600">
                                        { update.text }
                                    </div>
                                </div>
                            )) }
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <label className="flex cursor-pointer items-center gap-2 text-paragraph-sm text-text-sub-600">
                        <AlignCheckbox.Root
                            checked={ dontShowAgain }
                            onCheckedChange={ v => setDontShowAgain(v === true) }
                        />
                        Nicht erneut anzeigen
                    </label>
                    <AlignButton.Root
                        variant="primary"
                        mode="filled"
                        size="xsmall"
                        onClick={ () => handleOpenChange(false) }
                    >
                        Los geht's
                    </AlignButton.Root>
                </Modal.Footer>
            </Modal.Content>
        </Modal.Root>
    );
}
