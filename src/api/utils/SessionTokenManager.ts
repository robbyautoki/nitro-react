let _sessionToken: string | null = null;

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

export function getAuthHeaders(): Record<string, string>
{
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if(_sessionToken) headers['Authorization'] = `Bearer ${ _sessionToken }`;

    return headers;
}
