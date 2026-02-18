import { NitroConfiguration } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { LocalizeText, OpenUrl } from '../../../../../api';

export interface WidgetContainerViewProps
{
    conf: any;
}

export const WidgetContainerView: FC<WidgetContainerViewProps> = props =>
{
    const { conf = null } = props;

    const getOption = (key: string) =>
    {
        const option = conf[key];

        if(!option) return null;

        switch(key)
        {
            case 'image':
                return NitroConfiguration.interpolate(option);
        }

        return option;
    }

  	return (
        <div className="widgetcontainer widget flex flex-row overflow-hidden">
            <div className="widgetcontainer-image shrink-0" style={ { backgroundImage: `url(${ getOption('image') })` } } />
            <div className="flex flex-col self-center">
                <h3 className="my-0">{ LocalizeText(`landing.view.${ getOption('texts') }.header`) }</h3>
                <i>{ LocalizeText(`landing.view.${ getOption('texts') }.body`) }</i>
                <button className="btn btn-sm btn-gainsboro self-start px-3 mt-auto" onClick={ event => OpenUrl(getOption('btnLink')) }>{ LocalizeText(`landing.view.${ getOption('texts') }.button`) }</button>
            </div>
        </div>
  	);
}
