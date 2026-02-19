import { GetConfiguration } from '../nitro/GetConfiguration';

const getBaseUrl = () => `${ GetConfiguration<string>('url.prefix', '') }/api/inventory-categories`;

const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> =>
{
    const response = await fetch(`${ getBaseUrl() }${ path }`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if(!response.ok)
    {
        const err = await response.json().catch(() => ({ error: `HTTP ${ response.status }` }));

        throw new Error(err.error || `HTTP ${ response.status }`);
    }

    return response.json();
};

export interface ServerCategory
{
    id: number;
    name: string;
    color: string;
    autoFilter: string | null;
    order: number;
}

export interface ServerCategoryData
{
    categories: ServerCategory[];
    assignments: Record<number, number[]>;
}

export const CategoryApi = {
    load: () =>
        apiFetch<ServerCategoryData>(''),

    create: (name: string, color: string, autoFilter?: string | null) =>
        apiFetch<ServerCategory>('', {
            method: 'POST',
            body: JSON.stringify({ name, color, autoFilter: autoFilter || null }),
        }),

    update: (id: number, data: { name?: string; color?: string; order?: number; autoFilter?: string | null }) =>
        apiFetch<ServerCategory>(`/${ id }`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    remove: (id: number) =>
        apiFetch<{ success: boolean }>(`/${ id }`, {
            method: 'DELETE',
        }),

    assign: (categoryId: number, itemType: number) =>
        apiFetch<{ success: boolean }>(`/${ categoryId }/assignments`, {
            method: 'POST',
            body: JSON.stringify({ itemType }),
        }),

    unassign: (categoryId: number, itemType: number) =>
        apiFetch<{ success: boolean }>(`/${ categoryId }/assignments`, {
            method: 'DELETE',
            body: JSON.stringify({ itemType }),
        }),

    reorder: (order: number[]) =>
        apiFetch<{ success: boolean }>('/reorder', {
            method: 'PUT',
            body: JSON.stringify({ order }),
        }),
};
