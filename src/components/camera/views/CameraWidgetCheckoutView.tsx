import { CameraPublishStatusMessageEvent, CameraPurchaseOKMessageEvent, CameraStorageUrlMessageEvent, FurnitureListComposer, PublishPhotoMessageComposer, PurchasePhotoMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Image as ImageIcon, Loader2, Lock, RotateCcw, ShoppingBag, UploadCloud, X } from 'lucide-react';
import { CreateLinkEvent, GetConfiguration, GetRoomEngine, LocalizeText, SendMessageComposer } from '../../../api';
import { DraggableWindow, LayoutCurrencyIcon } from '../../../common';
import { useMessageEvent } from '../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';

export interface CameraWidgetCheckoutViewProps
{
    base64Url: string;
    onCloseClick: () => void;
    onCancelClick: () => void;
    price: { credits: number, duckets: number, publishDucketPrice: number };
}

export const CameraWidgetCheckoutView: FC<CameraWidgetCheckoutViewProps> = props =>
{
    const { base64Url = null, onCloseClick = null, onCancelClick = null, price = null } = props;
    const [ pictureUrl, setPictureUrl ] = useState<string>(null);
    const [ publishUrl, setPublishUrl ] = useState<string>(null);
    const [ picturesBought, setPicturesBought ] = useState(0);
    const [ wasPicturePublished, setWasPicturePublished ] = useState(false);
    const [ isWaiting, setIsWaiting ] = useState(false);
    const [ publishCooldown, setPublishCooldown ] = useState(0);
    const [ isPublic, setIsPublic ] = useState(true);

    const publishDisabled = useMemo(() => GetConfiguration<boolean>('camera.publish.disabled', false), []);

    useMessageEvent<CameraPurchaseOKMessageEvent>(CameraPurchaseOKMessageEvent, event =>
    {
        setPicturesBought(value => (value + 1));
        setIsWaiting(false);
        SendMessageComposer(new FurnitureListComposer());
    });

    useMessageEvent<CameraPublishStatusMessageEvent>(CameraPublishStatusMessageEvent, event =>
    {
        const parser = event.getParser();

        setPublishUrl(parser.extraDataId);
        setPublishCooldown(parser.secondsToWait);
        setWasPicturePublished(parser.ok);
        setIsWaiting(false);
    });

    useMessageEvent<CameraStorageUrlMessageEvent>(CameraStorageUrlMessageEvent, event =>
    {
        const parser = event.getParser();
        const cameraBaseUrl = GetConfiguration<string>('camera.url', '').replace(/\/+$/, '');
        const fileName = (parser.url || '').replace(/^\/+/, '');
        const nextUrl = /^https?:\/\//i.test(parser.url) ? parser.url : `${ cameraBaseUrl }/${ fileName }`;

        setPictureUrl(nextUrl);
    });

    const processAction = (type: string, value: string | number = null) =>
    {
        switch(type)
        {
            case 'close':
                onCloseClick();
                return;
            case 'buy':
                if(isWaiting) return;

                setIsWaiting(true);
                SendMessageComposer(new PurchasePhotoMessageComposer(''));
                return;
            case 'publish':
                if(isWaiting) return;

                setIsWaiting(true);
                SendMessageComposer(new PublishPhotoMessageComposer());
                return;
            case 'cancel':
                onCancelClick();
                return;
        }
    }

    useEffect(() =>
    {
        if(!base64Url) return;

        GetRoomEngine().saveBase64AsScreenshot(base64Url);
    }, [ base64Url ]);

    if(!price) return null;

    return (
        <DraggableWindow uniqueKey="nitro-camera-checkout">
            <AlignSurface.Panel className="nitro-camera-window nitro-camera-checkout">
                <div className="nitro-camera-header drag-handler">
                    <div className="nitro-camera-title">
                        <div className="nitro-camera-title-icon">
                            <ShoppingBag className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-label-sm text-text-strong-950">{ LocalizeText('camera.confirm_phase.title') }</div>
                            <div className="truncate text-paragraph-xs text-text-sub-600">Foto kaufen oder veröffentlichen</div>
                        </div>
                    </div>
                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ event => processAction('close') }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>
                <div className="nitro-camera-body nitro-camera-checkout-body">
                    <div className="nitro-camera-checkout-preview">
                        { (pictureUrl && pictureUrl.length) ?
                            <img alt="" src={ pictureUrl } /> :
                            <div className="nitro-camera-loading">
                                <Loader2 className="size-5 animate-spin text-primary-base" />
                                <span>{ LocalizeText('camera.loading') }</span>
                            </div> }
                    </div>
                    <div className="nitro-camera-card">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-label-sm text-text-strong-950">
                                <ImageIcon className="size-4 text-primary-base" />
                                { LocalizeText('camera.purchase.header') }
                            </div>
                            { ((price.credits > 0) || (price.duckets > 0)) &&
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-paragraph-xs text-text-sub-600">
                                    <span>{ LocalizeText('catalog.purchase.confirmation.dialog.cost') }</span>
                                    { (price.credits > 0) &&
                                        <span className="inline-flex items-center gap-1 rounded-full bg-bg-weak-50 px-2 py-1 text-label-xs text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200">
                                            { price.credits } <LayoutCurrencyIcon type={ -1 } />
                                        </span> }
                                    { (price.duckets > 0) &&
                                        <span className="inline-flex items-center gap-1 rounded-full bg-bg-weak-50 px-2 py-1 text-label-xs text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200">
                                            { price.duckets } <LayoutCurrencyIcon type={ 5 } />
                                        </span> }
                                </div> }
                            { (picturesBought > 0) &&
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-paragraph-xs text-success-base">
                                    <CheckCircle2 className="size-3.5" />
                                    <span>{ LocalizeText('camera.purchase.count.info') } { picturesBought }</span>
                                    <button type="button" className="text-primary-base underline-offset-2 hover:underline" onClick={ () => CreateLinkEvent('inventory/toggle') }>{ LocalizeText('camera.open.inventory') }</button>
                                </div> }
                        </div>
                        <AlignButton.Root type="button" variant="primary" mode="filled" size="small" disabled={ isWaiting || !pictureUrl } onClick={ event => processAction('buy') }>
                            { isWaiting ? <AlignButton.Icon as={ Loader2 } className="size-4 animate-spin" /> : <AlignButton.Icon as={ ShoppingBag } className="size-4" /> }
                            { LocalizeText(!picturesBought ? 'buy' : 'camera.buy.another.button.text') }
                        </AlignButton.Root>
                    </div>
                    { !publishDisabled &&
                        <div className="nitro-camera-card">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-label-sm text-text-strong-950">
                                    <UploadCloud className="size-4 text-verified-base" />
                                    { LocalizeText(wasPicturePublished ? 'camera.publish.successful' : 'camera.publish.explanation') }
                                </div>
                                { !wasPicturePublished &&
                                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-paragraph-xs text-text-sub-600">
                                        <input type="checkbox" checked={ isPublic } onChange={ e => setIsPublic(e.target.checked) } className="size-4 rounded border-stroke-soft-200 accent-primary-base" />
                                        <span>{ isPublic ? 'Öffentlich in der Galerie' : 'Privat speichern' }</span>
                                    </label> }
                                <div className="mt-2 text-paragraph-xs text-text-sub-600">
                                    { LocalizeText(wasPicturePublished ? 'camera.publish.success.short.info' : 'camera.publish.detailed.explanation') }
                                </div>
                                { wasPicturePublished && <a className="mt-2 inline-flex items-center gap-1 text-label-xs text-primary-base hover:underline" href={ publishUrl } rel="noreferrer" target="_blank">{ LocalizeText('camera.link.to.published') } <ExternalLink className="size-3" /></a> }
                                { !wasPicturePublished && (price.publishDucketPrice > 0) &&
                                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-bg-weak-50 px-2 py-1 text-label-xs text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200">
                                        { price.publishDucketPrice } <LayoutCurrencyIcon type={ 5 } />
                                    </div> }
                                { (publishCooldown > 0) &&
                                    <AlignBadge.Root className="mt-2" variant="lighter" color="orange" size="small">
                                        <AlignBadge.Icon as={ Lock } className="size-3" />
                                        { LocalizeText('camera.publish.wait', [ 'minutes' ], [ Math.ceil(publishCooldown / 60).toString() ]) }
                                    </AlignBadge.Root> }
                            </div>
                            { !wasPicturePublished &&
                                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" disabled={ (isWaiting || (publishCooldown > 0) || !pictureUrl) } onClick={ event => processAction('publish') }>
                                    <AlignButton.Icon as={ UploadCloud } className="size-4" />
                                    { LocalizeText('camera.publish.button.text') }
                                </AlignButton.Root> }
                        </div> }
                    <div className="text-center text-paragraph-xs text-text-sub-600">{ LocalizeText('camera.warning.disclaimer') }</div>
                    <div className="flex justify-end">
                        <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" onClick={ event => processAction('cancel') }>
                            <AlignButton.Icon as={ RotateCcw } className="size-4" />
                            { LocalizeText('generic.cancel') }
                        </AlignButton.Root>
                    </div>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
