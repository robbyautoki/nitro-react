import { WiredConditionlayout } from '../../../../api';
import { WiredConditionActorHasHandItemView } from './WiredConditionActorHasHandItem';
import { WiredConditionRandomChanceView } from './WiredConditionRandomChanceView';
import { WiredConditionActorIsGroupMemberView } from './WiredConditionActorIsGroupMemberView';
import { WiredConditionActorIsOnFurniView } from './WiredConditionActorIsOnFurniView';
import { WiredConditionActorIsTeamMemberView } from './WiredConditionActorIsTeamMemberView';
import { WiredConditionActorIsWearingBadgeView } from './WiredConditionActorIsWearingBadgeView';
import { WiredConditionActorIsWearingEffectView } from './WiredConditionActorIsWearingEffectView';
import { WiredConditionDateRangeView } from './WiredConditionDateRangeView';
import { WiredConditionFurniHasAvatarOnView } from './WiredConditionFurniHasAvatarOnView';
import { WiredConditionFurniHasFurniOnView } from './WiredConditionFurniHasFurniOnView';
import { WiredConditionFurniHasNotFurniOnView } from './WiredConditionFurniHasNotFurniOnView';
import { WiredConditionFurniIsOfTypeView } from './WiredConditionFurniIsOfTypeView';
import { WiredConditionFurniMatchesSnapshotView } from './WiredConditionFurniMatchesSnapshotView';
import { WiredConditionTimeElapsedLessView } from './WiredConditionTimeElapsedLessView';
import { WiredConditionTimeElapsedMoreView } from './WiredConditionTimeElapsedMoreView';
import { WiredConditionUserCountInRoomView } from './WiredConditionUserCountInRoomView';
import { WiredSelectorAreaView } from './WiredSelectorAreaView';
import { WiredSelectorNeighborhoodView } from './WiredSelectorNeighborhoodView';
import { WiredSelectorFurniPickerView } from './WiredSelectorFurniPickerView';
import { WiredSelectorNoConfigView } from './WiredSelectorNoConfigView';
import { WiredSelectorTeamView } from './WiredSelectorTeamView';
import { WiredSelectorByActionView } from './WiredSelectorByActionView';
import { WiredSelectorByNameView } from './WiredSelectorByNameView';
import { WiredSelectorHanditemView } from './WiredSelectorHanditemView';
import { WiredSelectorGroupView } from './WiredSelectorGroupView';
import { WiredSelectorAltitudeView } from './WiredSelectorAltitudeView';
import { WiredSelectorWithVarView } from './WiredSelectorWithVarView';
import { WiredFilterAmountView } from './WiredFilterAmountView';
import { WiredFilterByVarView } from './WiredFilterByVarView';

export const WiredConditionLayoutView = (code: number) =>
{
    switch(code)
    {
        case WiredConditionlayout.ACTOR_HAS_HANDITEM:
            return <WiredConditionActorHasHandItemView />;
        case WiredConditionlayout.ACTOR_IS_GROUP_MEMBER:
        case WiredConditionlayout.NOT_ACTOR_IN_GROUP:
            return <WiredConditionActorIsGroupMemberView />;
        case WiredConditionlayout.ACTOR_IS_ON_FURNI:
        case WiredConditionlayout.NOT_ACTOR_ON_FURNI:
            return <WiredConditionActorIsOnFurniView />;
        case WiredConditionlayout.ACTOR_IS_IN_TEAM:
        case WiredConditionlayout.NOT_ACTOR_IN_TEAM:
            return <WiredConditionActorIsTeamMemberView />;
        case WiredConditionlayout.ACTOR_IS_WEARING_BADGE:
        case WiredConditionlayout.NOT_ACTOR_WEARS_BADGE:
            return <WiredConditionActorIsWearingBadgeView />;
        case WiredConditionlayout.ACTOR_IS_WEARING_EFFECT:
        case WiredConditionlayout.NOT_ACTOR_WEARING_EFFECT:
            return <WiredConditionActorIsWearingEffectView />;
        case WiredConditionlayout.DATE_RANGE_ACTIVE:
            return <WiredConditionDateRangeView />;
        case WiredConditionlayout.FURNIS_HAVE_AVATARS:
        case WiredConditionlayout.FURNI_NOT_HAVE_HABBO:
            return <WiredConditionFurniHasAvatarOnView />;
        case WiredConditionlayout.HAS_STACKED_FURNIS:
            return <WiredConditionFurniHasFurniOnView />;
        case WiredConditionlayout.NOT_HAS_STACKED_FURNIS:
            return <WiredConditionFurniHasNotFurniOnView />;
        case WiredConditionlayout.STUFF_TYPE_MATCHES:
        case WiredConditionlayout.NOT_FURNI_IS_OF_TYPE:
            return <WiredConditionFurniIsOfTypeView />;
        case WiredConditionlayout.STATES_MATCH:
        case WiredConditionlayout.NOT_STATES_MATCH:
            return <WiredConditionFurniMatchesSnapshotView />;
        case WiredConditionlayout.TIME_ELAPSED_LESS:
            return <WiredConditionTimeElapsedLessView />;
        case WiredConditionlayout.TIME_ELAPSED_MORE:
            return <WiredConditionTimeElapsedMoreView />;
        case WiredConditionlayout.USER_COUNT_IN:
        case WiredConditionlayout.NOT_USER_COUNT_IN:
            return <WiredConditionUserCountInRoomView />;
        case WiredConditionlayout.RANDOM_CHANCE:
            return <WiredConditionRandomChanceView />;
        case WiredConditionlayout.SELECTOR_FURNI_AREA:
            return <WiredSelectorAreaView title="Furni Area" />;
        case WiredConditionlayout.SELECTOR_FURNI_NEIGHBORHOOD:
            return <WiredSelectorNeighborhoodView title="Möbel in der Nähe" />;
        case WiredConditionlayout.SELECTOR_FURNI_BY_TYPE:
            return <WiredSelectorFurniPickerView title="Furni By Type" />;
        case WiredConditionlayout.SELECTOR_FURNI_ON_FURNI:
            return <WiredSelectorFurniPickerView title="Furni On Furni" />;
        case WiredConditionlayout.SELECTOR_FURNI_PICKS:
            return <WiredSelectorFurniPickerView title="Furni Picks" />;
        case WiredConditionlayout.SELECTOR_FURNI_SIGNAL:
            return <WiredSelectorNoConfigView />;
        case WiredConditionlayout.SELECTOR_FURNI_ALTITUDE:
            return <WiredSelectorAltitudeView />;
        case WiredConditionlayout.SELECTOR_FURNI_WITH_VAR:
            return <WiredSelectorWithVarView />;
        case WiredConditionlayout.SELECTOR_USERS_AREA:
            return <WiredSelectorAreaView title="Users Area" />;
        case WiredConditionlayout.SELECTOR_USERS_NEIGHBORHOOD:
            return <WiredSelectorNeighborhoodView title="User in der Nähe" />;
        case WiredConditionlayout.SELECTOR_USERS_SIGNAL:
            return <WiredSelectorNoConfigView />;
        case WiredConditionlayout.SELECTOR_USERS_BY_TYPE:
            return <WiredSelectorNoConfigView />;
        case WiredConditionlayout.SELECTOR_USERS_IN_TEAM:
            return <WiredSelectorTeamView />;
        case WiredConditionlayout.SELECTOR_USERS_BY_ACTION:
            return <WiredSelectorByActionView />;
        case WiredConditionlayout.SELECTOR_USERS_BY_NAME:
            return <WiredSelectorByNameView />;
        case WiredConditionlayout.SELECTOR_USERS_ON_FURNI:
            return <WiredSelectorFurniPickerView title="Users On Furni" />;
        case WiredConditionlayout.SELECTOR_USERS_HANDITEM:
            return <WiredSelectorHanditemView />;
        case WiredConditionlayout.SELECTOR_USERS_IN_GROUP:
            return <WiredSelectorGroupView />;
        case WiredConditionlayout.SELECTOR_USERS_WITH_VAR:
            return <WiredSelectorWithVarView />;
        case WiredConditionlayout.SELECTOR_REMOTE:
            return <WiredSelectorNoConfigView />;
        case WiredConditionlayout.FILTER_USERS:
            return <WiredFilterAmountView title="Filter Users" />;
        case WiredConditionlayout.FILTER_FURNI:
            return <WiredFilterAmountView title="Filter Furni" />;
        case WiredConditionlayout.FILTER_USERS_VAR:
            return <WiredFilterByVarView title="Filter Users by Variable" />;
        case WiredConditionlayout.FILTER_FURNI_VAR:
            return <WiredFilterByVarView title="Filter Furni by Variable" />;
    }

    return null;
}
