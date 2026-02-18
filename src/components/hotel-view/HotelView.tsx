import { NitroConfiguration, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { GetConfiguration } from '../../api';
import { LayoutAvatarImageView } from '../../common';
import { useRoomSessionManagerEvent, useSessionInfo } from '../../hooks';
import { Prism } from './Prism';
import { WidgetSlotView } from './views/widgets/WidgetSlotView';

const widgetSlotCount = 7;

export const HotelView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(true);
    const { userFigure = null } = useSessionInfo();

    useRoomSessionManagerEvent<RoomSessionEvent>([
        RoomSessionEvent.CREATED,
        RoomSessionEvent.ENDED ], event =>
    {
        switch(event.type)
        {
            case RoomSessionEvent.CREATED:
                setIsVisible(false);
                return;
            case RoomSessionEvent.ENDED:
                setIsVisible(event.openLandingView);
                return;
        }
    });

    if(!isVisible) return null;

    return (
        <div className="nitro-hotel-view">
            <Prism animationType="rotate" transparent={ false } />
            <div className="container h-full py-3 overflow-hidden landing-widgets">
                <div className="row h-full">
                    <div className="col-9 h-full flex flex-col">
                        <WidgetSlotView
                            widgetSlot={ 1 }
                            widgetType={ GetConfiguration('hotelview')['widgets']['slot.' + 1 + '.widget'] }
                            widgetConf={ GetConfiguration('hotelview')['widgets']['slot.' + 1 + '.conf'] }
                            className="col-6"
                        />
                        <div className="col-12 row mx-0">
                            <WidgetSlotView
                                widgetSlot={ 2 }
                                widgetType={ GetConfiguration('hotelview')['widgets']['slot.' + 2 + '.widget'] }
                                widgetConf={ GetConfiguration('hotelview')['widgets']['slot.' + 2 + '.conf'] }
                                className="col-7"
                            />
                            <WidgetSlotView
                                widgetSlot={ 3 }
                                widgetType={ GetConfiguration('hotelview')['widgets']['slot.' + 3 + '.widget'] }
                                widgetConf={ GetConfiguration('hotelview')['widgets']['slot.' + 3 + '.conf'] }
                                className="col-5"
                            />
                            <WidgetSlotView
                                widgetSlot={ 4 }
                                widgetType={ GetConfiguration('hotelview')['widgets']['slot.' + 4 + '.widget'] }
                                widgetConf={ GetConfiguration('hotelview')['widgets']['slot.' + 4 + '.conf'] }
                                className="col-7"
                            />
                            <WidgetSlotView
                                widgetSlot={ 5 }
                                widgetType={ GetConfiguration('hotelview')['widgets']['slot.' + 5 + '.widget'] }
                                widgetConf={ GetConfiguration('hotelview')['widgets']['slot.' + 5 + '.conf'] }
                                className="col-5"
                            />
                        </div>
                        <WidgetSlotView
                            widgetSlot={ 6 }
                            widgetType={ GetConfiguration('hotelview')['widgets']['slot.' + 6 + '.widget'] }
                            widgetConf={ GetConfiguration('hotelview')['widgets']['slot.' + 6 + '.conf'] }
                            className="mt-auto"
                        />
                    </div>
                    <div className="col-3 h-full">
                        <WidgetSlotView
                            widgetSlot={ 7 }
                            widgetType={ GetConfiguration('hotelview')['widgets']['slot.' + 7 + '.widget'] }
                            widgetConf={ GetConfiguration('hotelview')['widgets']['slot.' + 7 +'.conf'] }
                        />
                    </div>
                </div>
            </div>
            { GetConfiguration('hotelview')['show.avatar'] && (
                <div className="avatar-image">
                    <LayoutAvatarImageView figure={ userFigure } direction={ 2 } />
                </div>
            ) }
        </div>
    );
}
