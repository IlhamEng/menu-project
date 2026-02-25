// Response Envelopes
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface ApiErrorResponse {
    success: boolean;
    message: string;
    errors?: Record<string, string>;
}

// Menu Types
export interface MenuItem {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    children: MenuItem[];
}

// Request Types
export interface CreateMenuPayload {
    name: string;
    description?: string;
    parent_id?: number;
    sort_order?: number;
}

export interface UpdateMenuPayload {
    name?: string;
    description?: string;
}

export interface MoveMenuPayload {
    parent_id: number | null;
}

export interface ReorderMenuPayload {
    sort_order: number;
}
