import { useState } from 'react';
import type { MenuItem } from '../../types/menu';
import { useMenuStore } from '../../store/useMenuStore';
import { HiChevronDown, HiPlus } from 'react-icons/hi2';

interface MenuTreeItemProps {
    item: MenuItem;
    depth: number;
    isLast: boolean;
    parentLines: boolean[];
    onAddChild: (parentId: number) => void;
}

export default function MenuTreeItem({
    item,
    depth,
    isLast,
    parentLines,
    onAddChild,
}: MenuTreeItemProps) {
    const { selectedMenu, selectMenu, expandedIds, toggleExpand, searchQuery } =
        useMenuStore();

    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedMenu?.id === item.id;
    const children = item.children ?? [];
    const hasChildren = children.length > 0;

    // Filter children by search query
    const filteredChildren = searchQuery
        ? children.filter((child) => matchesSearch(child, searchQuery))
        : children;

    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="select-none">
            {/* Current node */}
            <div
                className="flex items-center group relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Tree connector lines */}
                <div className="flex items-center" style={{ width: depth * 28 }}>
                    {parentLines.map((showLine, i) => (
                        <div
                            key={i}
                            className="w-7 h-8 relative flex-shrink-0"
                        >
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

                {/* Expand/Collapse toggle */}
                {hasChildren ? (
                    <button
                        onClick={() => toggleExpand(item.id)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors flex-shrink-0 cursor-pointer"
                    >
                        <HiChevronDown
                            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'
                                }`}
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

                {/* Add child button — visible on hover or always on selected */}
                {(isHovered || isSelected) && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild(item.id);
                        }}
                        className="ml-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                        title="Add child menu"
                    >
                        <HiPlus className="w-3.5 h-3.5 text-white" />
                    </button>
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/** Recursively check if item or any child matches search query */
function matchesSearch(item: MenuItem, query: string): boolean {
    const lower = query.toLowerCase();
    if (item.name.toLowerCase().includes(lower)) return true;
    return (item.children ?? []).some((child) => matchesSearch(child, lower));
}
