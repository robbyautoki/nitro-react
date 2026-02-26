import { GetConfiguration } from '../nitro';

let _sessionToken: string | null = null;
let _refreshing: Promise<void> | null = null;

export function initSessionToken(): void
{
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if(token) _sessionToken = token;
}

export function getSessionToken(): string | null
{
    return _sessionToken;
}

function getTokenExpiry(token: string): number | null
{
    try
    {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ?? null;
    }
    catch
    {
        return null;
    }
}

function isTokenExpiringSoon(token: string, thresholdSeconds = 300): boolean
{
    const exp = getTokenExpiry(token);
    if(!exp) return true;
    return (exp - (Date.now() / 1000)) < thresholdSeconds;
}

async function refreshToken(): Promise<void>
{
    if(!_sessionToken) return;

    try
    {
        const cmsUrl = GetConfiguration<string>('url.prefix', '');
        const res = await fetch(`${ cmsUrl }/api/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ _sessionToken }`
            }
        });

        if(res.ok)
        {
            const data = await res.json();
            if(data.token) _sessionToken = data.token;
        }
    }
    catch
    {
        // Keep using current token if refresh fails
    }
}

function ensureFreshToken(): void
{
    if(!_sessionToken) return;
    if(!isTokenExpiringSoon(_sessionToken)) return;

    if(!_refreshing)
    {
        _refreshing = refreshToken().finally(() => { _refreshing = null; });
    }
}

export function getAuthHeaders(): Record<string, string>
{
    ensureFreshToken();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if(_sessionToken) headers['Authorization'] = `Bearer ${ _sessionToken }`;

    return headers;
}
