import { GetConfiguration } from '../nitro';
import { getAuthHeaders } from '../utils/SessionTokenManager';
import { DEFAULT_EXTENDED_SETTINGS, ExtendedSettings } from './ExtendedSettings';

export async function fetchExtendedSettings(): Promise<ExtendedSettings>
{
    try
    {
        const cmsUrl = GetConfiguration<string>('url.prefix', '');
        const response = await fetch(`${ cmsUrl }/api/me/extended-settings`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include',
        });

        if(!response.ok) return DEFAULT_EXTENDED_SETTINGS;

        const data = await response.json();
        return { ...DEFAULT_EXTENDED_SETTINGS, ...data };
    }
    catch
    {
        return DEFAULT_EXTENDED_SETTINGS;
    }
}
