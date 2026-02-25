import { useState } from 'react';
import { HiChevronDown } from 'react-icons/hi2';
import { useMenuStore } from '../../store/useMenuStore';

export default function MenuDropdown() {
    const menus = useMenuStore((s) => s.menus);
    const [selectedRoot, setSelectedRoot] = useState<number | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const selectedMenu = selectedRoot !== null
        ? menus.find((m) => m.id === selectedRoot)
        : null;

    const displayLabel = selectedMenu ? selectedMenu.name : menus.length > 0 ? menus[0]?.name : 'No menus';

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Menu</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 hover:border-gray-300 transition-colors cursor-pointer"
            >
                <span>{displayLabel}</span>
                <HiChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 max-h-60 overflow-y-auto">
                    {menus.map((menu) => (
                        <button
                            key={menu.id}
                            onClick={() => {
                                setSelectedRoot(menu.id);
                                setIsOpen(false);
                            }}
                            className={`
                w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors cursor-pointer
                ${selectedRoot === menu.id ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'}
              `}
                        >
                            {menu.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
