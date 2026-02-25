import { describe, it, expect, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { menuApi } from '../api/menuApi';

// Mock axios
vi.mock('axios', () => {
    const mockAxiosInstance = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    };
    return {
        default: {
            create: vi.fn(() => mockAxiosInstance),
            __mockInstance: mockAxiosInstance,
        },
    };
});

// Get the mock instance
import axios from 'axios';
const mockAxios = (axios as unknown as { create: () => AxiosInstance; __mockInstance: Record<string, ReturnType<typeof vi.fn>> }).__mockInstance;

describe('menuApi', () => {
    describe('getAll', () => {
        it('should call GET /menus and return data', async () => {
            const mockData = [{ id: 1, name: 'Test', children: [] }];
            mockAxios.get.mockResolvedValue({
                data: { success: true, data: mockData },
            });

            const result = await menuApi.getAll();
            expect(result).toEqual(mockData);
            expect(mockAxios.get).toHaveBeenCalledWith('/menus');
        });

        it('should return empty array when data is undefined', async () => {
            mockAxios.get.mockResolvedValue({
                data: { success: true },
            });

            const result = await menuApi.getAll();
            expect(result).toEqual([]);
        });
    });

    describe('getById', () => {
        it('should call GET /menus/:id', async () => {
            const mockMenu = { id: 1, name: 'Test', children: [] };
            mockAxios.get.mockResolvedValue({
                data: { success: true, data: mockMenu },
            });

            const result = await menuApi.getById(1);
            expect(result).toEqual(mockMenu);
            expect(mockAxios.get).toHaveBeenCalledWith('/menus/1');
        });
    });

    describe('create', () => {
        it('should call POST /menus with payload', async () => {
            const payload = { name: 'New Menu' };
            const mockCreated = { id: 5, name: 'New Menu', children: [] };
            mockAxios.post.mockResolvedValue({
                data: { success: true, data: mockCreated },
            });

            const result = await menuApi.create(payload);
            expect(result).toEqual(mockCreated);
            expect(mockAxios.post).toHaveBeenCalledWith('/menus', payload);
        });
    });

    describe('update', () => {
        it('should call PUT /menus/:id with payload', async () => {
            const payload = { name: 'Updated' };
            const mockUpdated = { id: 1, name: 'Updated', children: [] };
            mockAxios.put.mockResolvedValue({
                data: { success: true, data: mockUpdated },
            });

            const result = await menuApi.update(1, payload);
            expect(result).toEqual(mockUpdated);
            expect(mockAxios.put).toHaveBeenCalledWith('/menus/1', payload);
        });
    });

    describe('delete', () => {
        it('should call DELETE /menus/:id', async () => {
            mockAxios.delete.mockResolvedValue({
                data: { success: true },
            });

            await menuApi.delete(1);
            expect(mockAxios.delete).toHaveBeenCalledWith('/menus/1');
        });
    });

    describe('move', () => {
        it('should call PATCH /menus/:id/move', async () => {
            const payload = { parent_id: 2 };
            const mockMoved = { id: 1, name: 'Test', parent_id: 2, children: [] };
            mockAxios.patch.mockResolvedValue({
                data: { success: true, data: mockMoved },
            });

            const result = await menuApi.move(1, payload);
            expect(result).toEqual(mockMoved);
            expect(mockAxios.patch).toHaveBeenCalledWith('/menus/1/move', payload);
        });
    });

    describe('reorder', () => {
        it('should call PATCH /menus/:id/reorder', async () => {
            const payload = { sort_order: 2 };
            const mockReordered = { id: 1, name: 'Test', sort_order: 2, children: [] };
            mockAxios.patch.mockResolvedValue({
                data: { success: true, data: mockReordered },
            });

            const result = await menuApi.reorder(1, payload);
            expect(result).toEqual(mockReordered);
            expect(mockAxios.patch).toHaveBeenCalledWith('/menus/1/reorder', payload);
        });
    });
});
