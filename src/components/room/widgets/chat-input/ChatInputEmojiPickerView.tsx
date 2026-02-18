import { FC, useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocalStorageKeys } from '../../../../api';
import { CATEGORIES, EMOJIS, getEmojisByCategory } from '../../../../api/utils/EmojiRegistry';
import { useLocalStorage } from '../../../../hooks';

const RECENT_CATEGORY_ID = '__recent__';
const MAX_RECENT = 20;

interface ChatInputEmojiPickerViewProps
{
    onSelectEmoji: (shortcode: string) => void;
}

export const ChatInputEmojiPickerView: FC<ChatInputEmojiPickerViewProps> = props =>
{
    const { onSelectEmoji = null } = props;
    const [ pickerVisible, setPickerVisible ] = useState(false);
    const [ activeCategory, setActiveCategory ] = useState(CATEGORIES[0].id);
    const [ searchQuery, setSearchQuery ] = useState('');
    const [ recentShortcodes, setRecentShortcodes ] = useLocalStorage<string[]>(
        LocalStorageKeys.RECENTLY_USED_EMOJIS, []
    );

    const recentEmojis = useMemo(() =>
    {
        if(recentShortcodes.length === 0) return [];

        const emojisByShortcode = new Map(EMOJIS.map(e => [ e.shortcode, e ]));

        return recentShortcodes
            .map(sc => emojisByShortcode.get(sc))
            .filter(Boolean);
    }, [ recentShortcodes ]);

    const filteredEmojis = useMemo(() =>
    {
        if(searchQuery.length > 0)
        {
            const query = searchQuery.toLowerCase();
            return EMOJIS.filter(e => e.shortcode.toLowerCase().includes(query));
        }

        if(activeCategory === RECENT_CATEGORY_ID)
        {
            return recentEmojis;
        }

        return getEmojisByCategory(activeCategory);
    }, [ activeCategory, searchQuery, recentEmojis ]);

    const selectEmoji = (shortcode: string) =>
    {
        if(onSelectEmoji) onSelectEmoji(`:${ shortcode }:`);

        setRecentShortcodes(prev =>
        {
            const filtered = (prev || []).filter(s => s !== shortcode);
            return [ shortcode, ...filtered ].slice(0, MAX_RECENT);
        });

        setPickerVisible(false);
        setSearchQuery('');
    };

    const handleOpenChange = (open: boolean) =>
    {
        setPickerVisible(open);

        if(!open)
        {
            setSearchQuery('');
        }
        else
        {
            if(recentShortcodes.length > 0)
            {
                setActiveCategory(RECENT_CATEGORY_ID);
            }
            else
            {
                setActiveCategory(CATEGORIES[0].id);
            }
        }
    };

    return (
        <Popover open={ pickerVisible } onOpenChange={ handleOpenChange }>
            <PopoverTrigger asChild>
                <div className="emoji-picker-trigger shrink-0 cursor-pointer transition-opacity hover:opacity-70 flex items-center justify-center" title="Emojis">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ { color: 'rgba(255, 255, 255, 0.45)' } }>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                </div>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                sideOffset={ 8 }
                className="emoji-picker-popover"
                onOpenAutoFocus={ (e) => e.preventDefault() }
            >
                <div className="emoji-picker-search">
                    <input
                        type="text"
                        className="emoji-search-input"
                        placeholder="Search emojis..."
                        value={ searchQuery }
                        onChange={ (e) => setSearchQuery(e.target.value) }
                        onKeyDown={ (e) => e.stopPropagation() }
                    />
                </div>
                { !searchQuery && (
                    <div className="emoji-category-tabs">
                        { recentShortcodes.length > 0 && (
                            <button
                                className={ `emoji-category-tab ${ activeCategory === RECENT_CATEGORY_ID ? 'active' : '' }` }
                                onClick={ () => setActiveCategory(RECENT_CATEGORY_ID) }
                                title="Recent"
                            >
                                { '\uD83D\uDD52' }
                            </button>
                        ) }
                        { CATEGORIES.map((cat) => (
                            <button
                                key={ cat.id }
                                className={ `emoji-category-tab ${ activeCategory === cat.id ? 'active' : '' }` }
                                onClick={ () => setActiveCategory(cat.id) }
                                title={ cat.label }
                            >
                                { cat.icon }
                            </button>
                        )) }
                    </div>
                ) }
                <ScrollArea className="emoji-grid-scroll">
                    <div className="emoji-grid">
                        { filteredEmojis.map((emoji) => (
                            <div
                                key={ `${ emoji.category }-${ emoji.shortcode }` }
                                className="emoji-grid-item"
                                onClick={ () => selectEmoji(emoji.shortcode) }
                                title={ `:${ emoji.shortcode }:` }
                            >
                                <img
                                    src={ `/emojis/${ emoji.category }/${ emoji.filename }` }
                                    alt={ `:${ emoji.shortcode }:` }
                                    className="emoji-grid-img"
                                    loading="lazy"
                                />
                            </div>
                        )) }
                        { filteredEmojis.length === 0 && (
                            <div className="emoji-no-results">No emojis found</div>
                        ) }
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
