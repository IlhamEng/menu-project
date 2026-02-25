import { useEffect, useState } from 'react';
import { useMenuStore } from '../../store/useMenuStore';
import MenuDropdown from './MenuDropdown';
import MenuTree from './MenuTree';
import MenuDetail from './MenuDetail';
import CreateMenuModal from './CreateMenuModal';
import { HiOutlineMagnifyingGlass, HiPlus } from 'react-icons/hi2';

export default function MenuPage() {
    const { loadMenus, searchQuery, setSearchQuery, error } = useMenuStore();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createParentId, setCreateParentId] = useState<number | null>(null);

    useEffect(() => {
        loadMenus();
    }, [loadMenus]);

    const handleAddChild = (parentId: number | null) => {
        setCreateParentId(parentId);
        setCreateModalOpen(true);
    };

    return (
        <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <span className="text-gray-300"><img src="/components/ic_system_grey.svg" /></span>
                <span>/</span>
                <span className="text-gray-600 font-medium">Menus</span>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0051AF] rounded-full flex items-center justify-center">
                        <img src="/components/ic_properties_bold.svg" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
                </div>

                <button
                    onClick={() => handleAddChild(null)}
                    className="flex justify-center items-center w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 bg-[#0051AF] hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                >
                    <HiPlus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Menu</span>
                </button>
            </div>

            {/* Error display */}
            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-6 lg:gap-8">
                {/* Left: Dropdown + Search + Tree */}
                <div className="space-y-4">
                    {/* Dropdown */}
                    <MenuDropdown />

                    {/* Search */}
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            placeholder="Search menus..."
                        />
                    </div>

                    {/* Tree */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm min-h-[300px]">
                        <MenuTree onAddChild={handleAddChild} />
                    </div>
                </div>

                {/* Right: Detail panel */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm h-fit lg:sticky lg:top-8">
                    <MenuDetail />
                </div>
            </div>

            {/* Create Modal */}
            <CreateMenuModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                parentId={createParentId}
            />
        </div>
    );
}
