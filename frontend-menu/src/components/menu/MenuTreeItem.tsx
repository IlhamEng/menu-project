import { useState } from 'react';
import type { MenuItem } from '../../types/menu';
import { useMenuStore } from '../../store/useMenuStore';
import { HiChevronDown, HiChevronUp, HiPlus } from 'react-icons/hi2';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

interface MenuTreeItemProps {
    item: MenuItem;
    depth: number;
    isLast: boolean;
    parentLines: boolean[];
    onAddChild: (parentId: number) => void;
    siblingIndex: number;
    siblingCount: number;
}

export default function MenuTreeItem({
    item,
    depth,
    isLast,
    parentLines,
    onAddChild,
    siblingIndex,
    siblingCount,
}: MenuTreeItemProps) {
    const { selectedMenu, selectMenu, expandedIds, toggleExpand, searchQuery, reorderMenu } =
        useMenuStore();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({ id: item.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
        transition: transition ?? 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedMenu?.id === item.id;
    const children = item.children ?? [];
    const hasChildren = children.length > 0;

    const filteredChildren = searchQuery
        ? children.filter((child) => matchesSearch(child, searchQuery))
        : children;

    const [isHovered, setIsHovered] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    const canMoveUp = siblingIndex > 0;
    const canMoveDown = siblingIndex < siblingCount - 1;

    const handleReorder = async (direction: 'up' | 'down') => {
        if (isReordering) return;
        const newOrder = direction === 'up' ? item.sort_order - 1 : item.sort_order + 1;
        setIsReordering(true);
        try {
            await reorderMenu(item.id, { sort_order: newOrder });
        } catch {
            toast.error('Failed to reorder menu');
        } finally {
            setIsReordering(false);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="select-none relative">
            {/* Drop indicator line */}
            {isOver && !isDragging && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
            )}
            {/* Current node */}
            <div
                className={`flex items-center group relative ${isDragging ? 'bg-blue-50 rounded-lg' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Tree connector lines */}
                <div className="flex items-center" style={{ width: depth * 28 }}>
                    {parentLines.map((showLine, i) => (
                        <div key={i} className="w-7 h-8 relative flex-shrink-0">
                            {showLine && (
                                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-300" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Branch connector */}
                {depth > 0 && (
                    <div className="w-7 h-8 relative flex-shrink-0">
                        <div className="absolute left-3 top-0 h-4 w-px bg-gray-300" />
                        <div className="absolute left-3 top-4 w-3.5 h-px bg-gray-300" />
                        {!isLast && (
                            <div className="absolute left-3 top-4 bottom-0 w-px bg-gray-300" />
                        )}
                    </div>
                )}

                {/* Drag handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
                    title="Drag to reorder"
                >
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="3" r="1.5" />
                        <circle cx="11" cy="3" r="1.5" />
                        <circle cx="5" cy="8" r="1.5" />
                        <circle cx="11" cy="8" r="1.5" />
                        <circle cx="5" cy="13" r="1.5" />
                        <circle cx="11" cy="13" r="1.5" />
                    </svg>
                </button>

                {/* Expand/Collapse toggle */}
                {hasChildren ? (
                    <button
                        onClick={() => toggleExpand(item.id)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0 cursor-pointer"
                    >
                        <HiChevronDown
                            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                        />
                    </button>
                ) : (
                    <div className="w-5 h-5 flex-shrink-0" />
                )}

                {/* Node name */}
                <button
                    onClick={() => selectMenu(item)}
                    className={`
                        ml-1 px-2 py-1 text-sm rounded-md cursor-pointer transition-colors whitespace-nowrap
                        ${isSelected
                            ? 'text-blue-700 font-semibold bg-blue-50'
                            : 'text-gray-800 hover:text-blue-600'
                        }
                    `}
                >
                    {item.name}
                </button>

                {/* Action buttons — visible on hover or selected */}
                {(isHovered || isSelected) && !isDragging && (
                    <div className="flex items-center gap-0.5 ml-1">
                        {canMoveUp && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleReorder('up'); }}
                                disabled={isReordering}
                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                                title="Move up"
                            >
                                <HiChevronUp className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                        )}
                        {canMoveDown && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleReorder('down'); }}
                                disabled={isReordering}
                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                                title="Move down"
                            >
                                <HiChevronDown className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddChild(item.id); }}
                            className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                            title="Add child menu"
                        >
                            <HiPlus className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                )}
            </div>

            {/* Children */}
            {isExpanded && filteredChildren.length > 0 && (
                <div>
                    {filteredChildren.map((child, index) => (
                        <MenuTreeItem
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            isLast={index === filteredChildren.length - 1}
                            parentLines={[...parentLines, !isLast && depth > 0 ? true : false]}
                            onAddChild={onAddChild}
                            siblingIndex={index}
                            siblingCount={filteredChildren.length}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function matchesSearch(item: MenuItem, query: string): boolean {
    const lower = query.toLowerCase();
    if (item.name.toLowerCase().includes(lower)) return true;
    return (item.children ?? []).some((child) => matchesSearch(child, lower));
}
