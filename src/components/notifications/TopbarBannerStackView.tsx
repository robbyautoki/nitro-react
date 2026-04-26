import { FC } from 'react';
import { useTopbarBanners } from '../../hooks';

export const TopbarBannerStackView: FC<{}> = () =>
{
    const banners = useTopbarBanners();

    if(banners.length === 0) return null;

    return (
        <>
            { banners.map(banner => (
                <div key={ banner.id } className="nitro-topbar-banner is-visible pointer-events-auto">
                    { banner.content }
                </div>
            )) }
        </>
    );
}
