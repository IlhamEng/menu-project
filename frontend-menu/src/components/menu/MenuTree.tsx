import { useMenuStore } from '../../store/useMenuStore';
import MenuTreeItem from './MenuTreeItem';
import Button from '../ui/Button';
import type { MenuItem } from '../../types/menu';

interface MenuTreeProps {
    onAddChild: (parentId: number | null) => void;
}

export default function MenuTree({ onAddChild }: MenuTreeProps) {
    const { menus, expandAll, collapseAll, searchQuery, isLoading } = useMenuStore();

    // Filter root menus by search
    const filteredMenus = searchQuery
        ? menus.filter((m) => matchesSearch(m, searchQuery))
        : menus;

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

            {/* Tree */}
            <div className="pl-1">
                {filteredMenus.map((item, index) => (
                    <MenuTreeItem
                        key={item.id}
                        item={item}
                        depth={0}
                        isLast={index === filteredMenus.length - 1}
                        parentLines={[]}
                        onAddChild={onAddChild}
                    />
                ))}
            </div>
        </div>
    );
}

function matchesSearch(item: MenuItem, query: string): boolean {
    const lower = query.toLowerCase();
    if (item.name.toLowerCase().includes(lower)) return true;
    return (item.children ?? []).some((child) => matchesSearch(child, lower));
}
