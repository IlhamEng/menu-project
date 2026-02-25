import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMenuStore } from '../store/useMenuStore';
import type { MenuItem } from '../types/menu';

// Mock the API module
vi.mock('../api/menuApi', () => ({
    menuApi: {
        getAll: vi.fn(),
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        move: vi.fn(),
        reorder: vi.fn(),
    },
}));

import { menuApi } from '../api/menuApi';

const mockMenus: MenuItem[] = [
    {
        id: 1,
        name: 'System Management',
        description: 'Root menu',
        parent_id: null,
        sort_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        children: [
            {
                id: 2,
                name: 'Systems',
                description: null,
                parent_id: 1,
                sort_order: 0,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                children: [
                    {
                        id: 3,
                        name: 'System Code',
                        description: null,
                        parent_id: 2,
                        sort_order: 0,
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z',
                        children: [],
                    },
                ],
            },
            {
                id: 4,
                name: 'Properties',
                description: null,
                parent_id: 1,
                sort_order: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                children: [],
            },
        ],
    },
];

describe('useMenuStore', () => {
    beforeEach(() => {
        // Fully reset the store state before each test
        useMenuStore.setState({
            menus: [],
            selectedMenu: null,
            expandedIds: new Set<number>(),
            searchQuery: '',
            isLoading: false,
            error: null,
        });
        vi.clearAllMocks();
    });

    describe('loadMenus', () => {
        it('should load menus from API', async () => {
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.loadMenus();
            });

            expect(result.current.menus).toEqual(mockMenus);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should handle API errors', async () => {
            vi.mocked(menuApi.getAll).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.loadMenus();
            });

            expect(result.current.menus).toEqual([]);
            expect(result.current.error).toBe('Network error');
            expect(result.current.isLoading).toBe(false);
        });

        it('should set loading state during fetch', async () => {
            let resolvePromise: (value: MenuItem[]) => void;
            const promise = new Promise<MenuItem[]>((resolve) => {
                resolvePromise = resolve;
            });
            vi.mocked(menuApi.getAll).mockReturnValue(promise);

            const { result } = renderHook(() => useMenuStore());

            act(() => {
                result.current.loadMenus();
            });

            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                resolvePromise!(mockMenus);
                await promise;
            });

            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('selectMenu', () => {
        it('should set the selected menu', () => {
            const { result } = renderHook(() => useMenuStore());

            act(() => {
                result.current.selectMenu(mockMenus[0]);
            });

            expect(result.current.selectedMenu).toEqual(mockMenus[0]);
        });

        it('should clear selection when null', () => {
            const { result } = renderHook(() => useMenuStore());

            act(() => {
                result.current.selectMenu(mockMenus[0]);
            });
            act(() => {
                result.current.selectMenu(null);
            });

            expect(result.current.selectedMenu).toBeNull();
        });
    });

    describe('expand/collapse', () => {
        it('should toggle expand for a menu item', () => {
            const { result } = renderHook(() => useMenuStore());

            act(() => {
                result.current.toggleExpand(1);
            });
            expect(result.current.expandedIds.has(1)).toBe(true);

            act(() => {
                result.current.toggleExpand(1);
            });
            expect(result.current.expandedIds.has(1)).toBe(false);
        });

        it('should expand all items', async () => {
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.loadMenus();
            });

            act(() => {
                result.current.expandAll();
            });

            expect(result.current.expandedIds.has(1)).toBe(true);
            expect(result.current.expandedIds.has(2)).toBe(true);
            expect(result.current.expandedIds.has(3)).toBe(true);
            expect(result.current.expandedIds.has(4)).toBe(true);
        });

        it('should collapse all items', async () => {
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.loadMenus();
            });

            act(() => {
                result.current.expandAll();
            });
            act(() => {
                result.current.collapseAll();
            });

            expect(result.current.expandedIds.size).toBe(0);
        });
    });

    describe('search', () => {
        it('should set search query', () => {
            const { result } = renderHook(() => useMenuStore());

            act(() => {
                result.current.setSearchQuery('System');
            });

            expect(result.current.searchQuery).toBe('System');
        });
    });

    describe('helpers', () => {
        it('should find menu by ID in tree', async () => {
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.loadMenus();
            });

            const found = result.current.findMenuById(3);
            expect(found).toBeDefined();
            expect(found?.name).toBe('System Code');
        });

        it('should return null for non-existent ID', async () => {
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.loadMenus();
            });

            const found = result.current.findMenuById(999);
            expect(found).toBeNull();
        });

        it('should calculate correct depth', async () => {
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.loadMenus();
            });

            expect(result.current.getDepth(1)).toBe(0);
            expect(result.current.getDepth(2)).toBe(1);
            expect(result.current.getDepth(3)).toBe(2);
        });

        it('should find parent menu', async () => {
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.loadMenus();
            });

            const parent = result.current.getParent(3);
            expect(parent).toBeDefined();
            expect(parent?.name).toBe('Systems');

            const rootParent = result.current.getParent(1);
            expect(rootParent).toBeNull();
        });
    });

    describe('CRUD operations', () => {
        it('should create a menu and reload', async () => {
            const newMenu: MenuItem = {
                id: 5,
                name: 'New Menu',
                description: null,
                parent_id: 1,
                sort_order: 2,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                children: [],
            };
            vi.mocked(menuApi.create).mockResolvedValue(newMenu);
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.createMenu({ name: 'New Menu', parent_id: 1 });
            });

            expect(menuApi.create).toHaveBeenCalledWith({ name: 'New Menu', parent_id: 1 });
            expect(menuApi.getAll).toHaveBeenCalled();
        });

        it('should delete a menu and clear selection if deleted menu was selected', async () => {
            vi.mocked(menuApi.delete).mockResolvedValue(undefined);
            vi.mocked(menuApi.getAll).mockResolvedValue([]);

            const { result } = renderHook(() => useMenuStore());

            act(() => {
                result.current.selectMenu(mockMenus[0]);
            });

            await act(async () => {
                await result.current.deleteMenu(1);
            });

            expect(result.current.selectedMenu).toBeNull();
            expect(menuApi.delete).toHaveBeenCalledWith(1);
        });

        it('should update a menu and reload', async () => {
            const updated = { ...mockMenus[0], name: 'Updated' };
            vi.mocked(menuApi.update).mockResolvedValue(updated);
            vi.mocked(menuApi.getAll).mockResolvedValue(mockMenus);

            const { result } = renderHook(() => useMenuStore());

            await act(async () => {
                await result.current.updateMenu(1, { name: 'Updated' });
            });

            expect(menuApi.update).toHaveBeenCalledWith(1, { name: 'Updated' });
        });
    });
});
