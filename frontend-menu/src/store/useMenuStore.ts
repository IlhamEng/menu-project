import { create } from 'zustand';
import type {
    MenuItem,
    CreateMenuPayload,
    UpdateMenuPayload,
    MoveMenuPayload,
    ReorderMenuPayload,
} from '../types/menu';
import { menuApi } from '../api/menuApi';

/** Recursively collect all IDs in a tree */
function collectIds(items: MenuItem[]): number[] {
    const ids: number[] = [];
    for (const item of items) {
        ids.push(item.id);
        const children = item.children ?? [];
        if (children.length > 0) {
            ids.push(...collectIds(children));
        }
    }
    return ids;
}

/** Find a menu item by ID in the tree */
function findById(items: MenuItem[], id: number): MenuItem | null {
    for (const item of items) {
        if (item.id === id) return item;
        const children = item.children ?? [];
        if (children.length > 0) {
            const found = findById(children, id);
            if (found) return found;
        }
    }
    return null;
}

/** Calculate the depth of a node in the tree */
function calculateDepth(items: MenuItem[], targetId: number, currentDepth = 0): number {
    for (const item of items) {
        if (item.id === targetId) return currentDepth;
        const children = item.children ?? [];
        if (children.length > 0) {
            const depth = calculateDepth(children, targetId, currentDepth + 1);
            if (depth !== -1) return depth;
        }
    }
    return -1;
}

interface MenuStore {
    // State
    menus: MenuItem[];
    selectedMenu: MenuItem | null;
    expandedIds: Set<number>;
    searchQuery: string;
    isLoading: boolean;
    error: string | null;

    // Actions
    loadMenus: () => Promise<void>;
    selectMenu: (menu: MenuItem | null) => void;
    toggleExpand: (id: number) => void;
    expandAll: () => void;
    collapseAll: () => void;
    setSearchQuery: (query: string) => void;
    createMenu: (payload: CreateMenuPayload) => Promise<MenuItem>;
    updateMenu: (id: number, payload: UpdateMenuPayload) => Promise<MenuItem>;
    deleteMenu: (id: number) => Promise<void>;
    moveMenu: (id: number, payload: MoveMenuPayload) => Promise<MenuItem>;
    reorderMenu: (id: number, payload: ReorderMenuPayload) => Promise<MenuItem>;

    // Helpers
    getDepth: (id: number) => number;
    getParent: (id: number) => MenuItem | null;
    findMenuById: (id: number) => MenuItem | null;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
    menus: [],
    selectedMenu: null,
    expandedIds: new Set<number>(),
    searchQuery: '',
    isLoading: false,
    error: null,

    loadMenus: async () => {
        set({ isLoading: true, error: null });
        try {
            const menus = await menuApi.getAll();
            set({ menus, isLoading: false });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load menus';
            set({ error: message, isLoading: false });
        }
    },

    selectMenu: (menu) => {
        set({ selectedMenu: menu });
    },

    toggleExpand: (id) => {
        set((state) => {
            const newExpanded = new Set(state.expandedIds);
            if (newExpanded.has(id)) {
                newExpanded.delete(id);
            } else {
                newExpanded.add(id);
            }
            return { expandedIds: newExpanded };
        });
    },

    expandAll: () => {
        const allIds = collectIds(get().menus);
        set({ expandedIds: new Set(allIds) });
    },

    collapseAll: () => {
        set({ expandedIds: new Set<number>() });
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
    },

    createMenu: async (payload) => {
        const created = await menuApi.create(payload);
        await get().loadMenus();
        return created;
    },

    updateMenu: async (id, payload) => {
        const updated = await menuApi.update(id, payload);
        await get().loadMenus();
        // Update selected menu if it was the one being edited
        const { selectedMenu } = get();
        if (selectedMenu && selectedMenu.id === id) {
            const refreshed = findById(get().menus, id);
            set({ selectedMenu: refreshed });
        }
        return updated;
    },

    deleteMenu: async (id) => {
        await menuApi.delete(id);
        const { selectedMenu } = get();
        if (selectedMenu && selectedMenu.id === id) {
            set({ selectedMenu: null });
        }
        await get().loadMenus();
    },

    moveMenu: async (id, payload) => {
        const moved = await menuApi.move(id, payload);
        await get().loadMenus();
        return moved;
    },

    reorderMenu: async (id, payload) => {
        const reordered = await menuApi.reorder(id, payload);
        await get().loadMenus();
        return reordered;
    },

    getDepth: (id) => {
        return calculateDepth(get().menus, id);
    },

    getParent: (id) => {
        const item = findById(get().menus, id);
        if (!item || item.parent_id === null) return null;
        return findById(get().menus, item.parent_id);
    },

    findMenuById: (id) => {
        return findById(get().menus, id);
    },
}));
