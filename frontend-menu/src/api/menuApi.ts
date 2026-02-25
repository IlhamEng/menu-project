import axios from 'axios';
import type {
    ApiResponse,
    MenuItem,
    CreateMenuPayload,
    UpdateMenuPayload,
    MoveMenuPayload,
    ReorderMenuPayload,
} from '../types/menu';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const menuApi = {
    /** GET /api/menus — Fetch all menus as tree */
    getAll: async (): Promise<MenuItem[]> => {
        const { data } = await api.get<ApiResponse<MenuItem[]>>('/menus');
        return data.data ?? [];
    },

    /** GET /api/menus/:id — Fetch single menu by ID with subtree */
    getById: async (id: number): Promise<MenuItem> => {
        const { data } = await api.get<ApiResponse<MenuItem>>(`/menus/${id}`);
        return data.data!;
    },

    /** POST /api/menus — Create a new menu */
    create: async (payload: CreateMenuPayload): Promise<MenuItem> => {
        const { data } = await api.post<ApiResponse<MenuItem>>('/menus', payload);
        return data.data!;
    },

    /** PUT /api/menus/:id — Update menu name/description */
    update: async (id: number, payload: UpdateMenuPayload): Promise<MenuItem> => {
        const { data } = await api.put<ApiResponse<MenuItem>>(`/menus/${id}`, payload);
        return data.data!;
    },

    /** DELETE /api/menus/:id — Delete menu (cascade) */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/menus/${id}`);
    },

    /** PATCH /api/menus/:id/move — Move menu to different parent */
    move: async (id: number, payload: MoveMenuPayload): Promise<MenuItem> => {
        const { data } = await api.patch<ApiResponse<MenuItem>>(`/menus/${id}/move`, payload);
        return data.data!;
    },

    /** PATCH /api/menus/:id/reorder — Change sort order among siblings */
    reorder: async (id: number, payload: ReorderMenuPayload): Promise<MenuItem> => {
        const { data } = await api.patch<ApiResponse<MenuItem>>(`/menus/${id}/reorder`, payload);
        return data.data!;
    },
};

export default api;
