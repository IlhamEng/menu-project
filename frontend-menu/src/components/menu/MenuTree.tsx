import { useMenuStore } from '../../store/useMenuStore';
import MenuTreeItem from './MenuTreeItem';
import Button from '../ui/Button';
import type { MenuItem } from '../../types/menu';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface MenuTreeProps {
    onAddChild: (parentId: number | null) => void;
}

/** Flatten visible tree items into an ordered list */
function flattenVisible(
    items: MenuItem[],
    expandedIds: Set<number>,
    depth = 0,
    parentId: number | null = null
): { item: MenuItem; depth: number; parentId: number | null; siblingIndex: number; siblingCount: number }[] {
    const result: { item: MenuItem; depth: number; parentId: number | null; siblingIndex: number; siblingCount: number }[] = [];
    items.forEach((item, index) => {
        result.push({ item, depth, parentId, siblingIndex: index, siblingCount: items.length });
        const children = item.children ?? [];
        if (expandedIds.has(item.id) && children.length > 0) {
            result.push(...flattenVisible(children, expandedIds, depth + 1, item.id));
        }
    });
    return result;
}

export default function MenuTree({ onAddChild }: MenuTreeProps) {
    const { menus, expandAll, collapseAll, searchQuery, isLoading, expandedIds, reorderMenu, moveMenu } = useMenuStore();
    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    // Filter root menus by search
    const filteredMenus = searchQuery
        ? menus.filter((m) => matchesSearch(m, searchQuery))
        : menus;

    // Flatten visible items for DnD
    const flatItems = flattenVisible(filteredMenus, expandedIds);
    const sortableIds = flatItems.map((f) => f.item.id);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeItem = flatItems.find((f) => f.item.id === active.id);
        const overItem = flatItems.find((f) => f.item.id === over.id);
        if (!activeItem || !overItem) return;

        try {
            if (activeItem.parentId === overItem.parentId) {
                // Same parent → reorder
                await reorderMenu(activeItem.item.id, { sort_order: overItem.siblingIndex });
            } else {
                // Different parent → move to over item's parent, then reorder
                await moveMenu(activeItem.item.id, { parent_id: overItem.parentId });
            }
        } catch {
            toast.error('Failed to move menu item');
        }
    };

    const activeFlat = activeId ? flatItems.find((f) => f.item.id === activeId) : null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-500">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Loading menus...</span>
                </div>
            </div>
        );
    }

    if (filteredMenus.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <img src="/components/ic_system_grey.svg" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                        {searchQuery ? 'No menus found' : 'No menus yet'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Create your first menu to get started'}
                    </p>
                </div>
                {!searchQuery && (
                    <Button size="sm" onClick={() => onAddChild(null)}>
                        Create Menu
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div>
            {/* Expand / Collapse buttons */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Button variant="black" size="full" className="flex-1 sm:flex-none rounded-full" onClick={expandAll}>
                    Expand All
                </Button>
                <Button variant="secondary" size="full" className="flex-1 sm:flex-none rounded-full" onClick={collapseAll}>
                    Collapse All
                </Button>
            </div>

            {/* DnD Tree */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    <div className="pl-1">
                        {filteredMenus.map((item, index) => (
                            <MenuTreeItem
                                key={item.id}
                                item={item}
                                depth={0}
                                isLast={index === filteredMenus.length - 1}
                                parentLines={[]}
                                onAddChild={onAddChild}
                                siblingIndex={index}
                                siblingCount={filteredMenus.length}
                            />
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay>
                    {activeFlat ? (
                        <div className="bg-white border border-blue-300 rounded-lg px-3 py-1.5 shadow-lg text-sm font-medium text-blue-700 opacity-90">
                            {activeFlat.item.name}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function matchesSearch(item: MenuItem, query: string): boolean {
    const lower = query.toLowerCase();
    if (item.name.toLowerCase().includes(lower)) return true;
    return (item.children ?? []).some((child) => matchesSearch(child, lower));
}
