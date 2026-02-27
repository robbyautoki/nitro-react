import { AvatarAction, AvatarExpressionEnum, RoomControllerLevel, RoomObjectCategory, RoomUnitDropHandItemComposer } from '@nitrots/nitro-renderer';
import { Dispatch, FC, SetStateAction, useState } from 'react';
import { Armchair, ChevronLeft, ChevronRight, Hand, Hash, Laugh, Moon, Music, Package, Paintbrush, PersonStanding, Shirt, SmilePlus, User, Wind } from 'lucide-react';
import { AvatarInfoUser, CreateLinkEvent, DispatchUiEvent, GetCanStandUp, GetCanUseExpression, GetOwnPosture, GetUserProfile, HasHabboClub, HasHabboVip, IsRidingHorse, LocalizeText, PostureTypeEnum, SendMessageComposer } from '../../../../../api';
import { LayoutCurrencyIcon } from '../../../../../common';
import { HelpNameChangeEvent } from '../../../../../events';
import { useRoom } from '../../../../../hooks';
import { ContextMenuView } from '../../context-menu/ContextMenuView';

interface AvatarInfoWidgetOwnAvatarViewProps
{
    avatarInfo: AvatarInfoUser;
    isDancing: boolean;
    setIsDecorating: Dispatch<SetStateAction<boolean>>;
    onClose: () => void;
}

const MODE_NORMAL = 0;
const MODE_CLUB_DANCES = 1;
const MODE_NAME_CHANGE = 2;
const MODE_EXPRESSIONS = 3;
const MODE_SIGNS = 4;

export const AvatarInfoWidgetOwnAvatarView: FC<AvatarInfoWidgetOwnAvatarViewProps> = props =>
{
    const { avatarInfo = null, isDancing = false, setIsDecorating = null, onClose = null } = props;
    const [ mode, setMode ] = useState((isDancing && HasHabboClub()) ? MODE_CLUB_DANCES : MODE_NORMAL);
    const { roomSession = null } = useRoom();

    const processAction = (name: string) =>
    {
        let hideMenu = true;

        if(name)
        {
            if(name.startsWith('sign_'))
            {
                const sign = parseInt(name.split('_')[1]);

                roomSession.sendSignMessage(sign);
            }
            else
            {
                switch(name)
                {
                    case 'decorate':
                        setIsDecorating(true);
                        break;
                    case 'change_name':
                        DispatchUiEvent(new HelpNameChangeEvent(HelpNameChangeEvent.INIT));
                        break;
                    case 'change_looks':
                        CreateLinkEvent('avatar-editor/show');
                        break;
                    case 'expressions':
                        hideMenu = false;
                        setMode(MODE_EXPRESSIONS);
                        break;
                    case 'sit':
                        roomSession.sendPostureMessage(PostureTypeEnum.POSTURE_SIT);
                        break;
                    case 'stand':
                        roomSession.sendPostureMessage(PostureTypeEnum.POSTURE_STAND);
                        break;
                    case 'wave':
                        roomSession.sendExpressionMessage(AvatarExpressionEnum.WAVE.ordinal);
                        break;
                    case 'blow':
                        roomSession.sendExpressionMessage(AvatarExpressionEnum.BLOW.ordinal);
                        break;
                    case 'laugh':
                        roomSession.sendExpressionMessage(AvatarExpressionEnum.LAUGH.ordinal);
                        break;
                    case 'idle':
                        roomSession.sendExpressionMessage(AvatarExpressionEnum.IDLE.ordinal);
                        break;
                    case 'dance_menu':
                        hideMenu = false;
                        setMode(MODE_CLUB_DANCES);
                        break;
                    case 'dance':
                        roomSession.sendDanceMessage(1);
                        break;
                    case 'dance_stop':
                        roomSession.sendDanceMessage(0);
                        break;
                    case 'dance_1':
                    case 'dance_2':
                    case 'dance_3':
                    case 'dance_4':
                        roomSession.sendDanceMessage(parseInt(name.charAt((name.length - 1))));
                        break;
                    case 'signs':
                        hideMenu = false;
                        setMode(MODE_SIGNS);
                        break;
                    case 'back':
                        hideMenu = false;
                        setMode(MODE_NORMAL);
                        break;
                    case 'drop_carry_item':
                        SendMessageComposer(new RoomUnitDropHandItemComposer());
                        break;
                }
            }
        }

        if(hideMenu) onClose();
    }

    const isShowDecorate = () => (avatarInfo.amIOwner || avatarInfo.amIAnyRoomController || (avatarInfo.roomControllerLevel > RoomControllerLevel.GUEST));
    
    const isRidingHorse = IsRidingHorse();

    const MI = 'group w-full flex items-center gap-2 px-3 py-[6px] text-[12px] font-medium text-foreground hover:bg-accent cursor-pointer transition-all duration-75 rounded-[3px]';
    const IC = 'size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors';
    const AR = 'size-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors ml-auto';

    return (
        <ContextMenuView objectId={ avatarInfo.roomIndex } category={ RoomObjectCategory.UNIT } userType={ avatarInfo.userType } onClose={ onClose } collapsable={ true }>
            <button onClick={ () => GetUserProfile(avatarInfo.webID) } className="w-full px-3 py-2 text-center text-[13px] font-bold text-foreground border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors rounded-t-[3px]">
                { avatarInfo.name }
            </button>
            { (mode === MODE_NORMAL) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    { avatarInfo.allowNameChange &&
                        <button className={ MI } onClick={ () => processAction('change_name') }>
                            <User className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.avatar.change_name') }</span>
                        </button> }
                    { isShowDecorate() &&
                        <button className={ MI } onClick={ () => processAction('decorate') }>
                            <Paintbrush className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.avatar.decorate') }</span>
                        </button> }
                    <button className={ MI } onClick={ () => processAction('change_looks') }>
                        <Shirt className={ IC } />
                        <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.myclothes') }</span>
                    </button>
                    { (HasHabboClub() && !isRidingHorse) &&
                        <button className={ MI } onClick={ () => processAction('dance_menu') }>
                            <Music className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.dance') }</span>
                            <ChevronRight className={ AR } />
                        </button> }
                    { (!isDancing && !HasHabboClub() && !isRidingHorse) &&
                        <button className={ MI } onClick={ () => processAction('dance') }>
                            <Music className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.dance') }</span>
                        </button> }
                    { (isDancing && !HasHabboClub() && !isRidingHorse) &&
                        <button className={ MI } onClick={ () => processAction('dance_stop') }>
                            <Music className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.dance.stop') }</span>
                        </button> }
                    <button className={ MI } onClick={ () => processAction('expressions') }>
                        <SmilePlus className={ IC } />
                        <span className="flex-1 text-left truncate">{ LocalizeText('infostand.link.expressions') }</span>
                        <ChevronRight className={ AR } />
                    </button>
                    <button className={ MI } onClick={ () => processAction('signs') }>
                        <Hash className={ IC } />
                        <span className="flex-1 text-left truncate">{ LocalizeText('infostand.show.signs') }</span>
                        <ChevronRight className={ AR } />
                    </button>
                    { (avatarInfo.carryItem > 0) &&
                        <button className={ MI } onClick={ () => processAction('drop_carry_item') }>
                            <Package className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('avatar.widget.drop_hand_item') }</span>
                        </button> }
                </div> }
            { (mode === MODE_CLUB_DANCES) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    { isDancing &&
                        <button className={ MI } onClick={ () => processAction('dance_stop') }>
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.dance.stop') }</span>
                        </button> }
                    <button className={ MI } onClick={ () => processAction('dance_1') }><span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.dance1') }</span></button>
                    <button className={ MI } onClick={ () => processAction('dance_2') }><span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.dance2') }</span></button>
                    <button className={ MI } onClick={ () => processAction('dance_3') }><span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.dance3') }</span></button>
                    <button className={ MI } onClick={ () => processAction('dance_4') }><span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.dance4') }</span></button>
                    <button className={ `${ MI } text-muted-foreground` } onClick={ () => processAction('back') }>
                        <ChevronLeft className="size-3 text-muted-foreground/50" />
                        <span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span>
                    </button>
                </div> }
            { (mode === MODE_EXPRESSIONS) &&
                <div className="flex flex-col gap-0.5 p-0.5">
                    { (GetOwnPosture() === AvatarAction.POSTURE_STAND) &&
                        <button className={ MI } onClick={ () => processAction('sit') }>
                            <Armchair className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.sit') }</span>
                        </button> }
                    { GetCanStandUp() &&
                        <button className={ MI } onClick={ () => processAction('stand') }>
                            <PersonStanding className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.stand') }</span>
                        </button> }
                    { GetCanUseExpression() &&
                        <button className={ MI } onClick={ () => processAction('wave') }>
                            <Hand className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.wave') }</span>
                        </button> }
                    { GetCanUseExpression() &&
                        <button className={ HasHabboVip() ? MI : `${ MI } opacity-40 cursor-not-allowed` } onClick={ () => { if(HasHabboVip()) processAction('laugh'); } }>
                            <Laugh className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.laugh') }</span>
                            { !HasHabboVip() && <LayoutCurrencyIcon type="hc" /> }
                        </button> }
                    { GetCanUseExpression() &&
                        <button className={ HasHabboVip() ? MI : `${ MI } opacity-40 cursor-not-allowed` } onClick={ () => { if(HasHabboVip()) processAction('blow'); } }>
                            <Wind className={ IC } />
                            <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.blow') }</span>
                            { !HasHabboVip() && <LayoutCurrencyIcon type="hc" /> }
                        </button> }
                    <button className={ MI } onClick={ () => processAction('idle') }>
                        <Moon className={ IC } />
                        <span className="flex-1 text-left truncate">{ LocalizeText('widget.memenu.idle') }</span>
                    </button>
                    <button className={ `${ MI } text-muted-foreground` } onClick={ () => processAction('back') }>
                        <ChevronLeft className="size-3 text-muted-foreground/50" />
                        <span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span>
                    </button>
                </div> }
            { (mode === MODE_SIGNS) &&
                <div className="p-1 space-y-0.5">
                    { [[1,2,3],[4,5,6],[7,8,9]].map((row, ri) => (
                        <div key={ ri } className="grid grid-cols-3 gap-0.5">
                            { row.map(n => (
                                <button key={ n } onClick={ () => processAction(`sign_${ n }`) } className="h-6 rounded bg-accent hover:bg-accent/80 text-[12px] font-bold text-foreground cursor-pointer transition-colors">{ n }</button>
                            )) }
                        </div>
                    )) }
                    <div className="grid grid-cols-3 gap-0.5">
                        <button onClick={ () => processAction('sign_10') } className="h-6 rounded bg-accent hover:bg-accent/80 text-[11px] font-bold text-foreground cursor-pointer transition-colors">10</button>
                        <button onClick={ () => processAction('sign_11') } className="h-6 rounded bg-accent hover:bg-accent/80 text-foreground cursor-pointer transition-colors flex items-center justify-center"><i className="icon icon-sign-heart" /></button>
                        <button onClick={ () => processAction('sign_12') } className="h-6 rounded bg-accent hover:bg-accent/80 text-foreground cursor-pointer transition-colors flex items-center justify-center"><i className="icon icon-sign-skull" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-0.5">
                        <button onClick={ () => processAction('sign_0') } className="h-6 rounded bg-accent hover:bg-accent/80 text-[12px] font-bold text-foreground cursor-pointer transition-colors">0</button>
                        <button onClick={ () => processAction('sign_13') } className="h-6 rounded bg-accent hover:bg-accent/80 text-foreground cursor-pointer transition-colors flex items-center justify-center"><i className="icon icon-sign-exclamation" /></button>
                        <button onClick={ () => processAction('sign_15') } className="h-6 rounded bg-accent hover:bg-accent/80 text-foreground cursor-pointer transition-colors flex items-center justify-center"><i className="icon icon-sign-smile" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-0.5">
                        <button onClick={ () => processAction('sign_14') } className="h-6 rounded bg-accent hover:bg-accent/80 text-foreground cursor-pointer transition-colors flex items-center justify-center"><i className="icon icon-sign-soccer" /></button>
                        <button onClick={ () => processAction('sign_17') } className="h-6 rounded bg-accent hover:bg-accent/80 text-foreground cursor-pointer transition-colors flex items-center justify-center"><i className="icon icon-sign-yellow" /></button>
                        <button onClick={ () => processAction('sign_16') } className="h-6 rounded bg-accent hover:bg-accent/80 text-foreground cursor-pointer transition-colors flex items-center justify-center"><i className="icon icon-sign-red" /></button>
                    </div>
                    <button className={ `${ MI } text-muted-foreground` } onClick={ () => processAction('back') }>
                        <ChevronLeft className="size-3 text-muted-foreground/50" />
                        <span className="flex-1 text-left truncate">{ LocalizeText('generic.back') }</span>
                    </button>
                </div> }
        </ContextMenuView>
    );
}
