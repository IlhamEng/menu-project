import { HiOutlineMenuAlt2, HiMenuAlt3 } from 'react-icons/hi';

const sidebarItems: { label: string; icon: string }[] = [
    { label: 'Systems', icon: '/components/ic_system.svg' },
    { label: 'System Code', icon: '/components/ic_properties_light.svg' },
    { label: 'Properties', icon: '/components/ic_properties.svg' },
    { label: 'Menus', icon: '/components/ic_submenu.svg' },
    { label: 'API List', icon: '/components/ic_properties.svg' },
    { label: 'Users & Group', icon: '/components/ic_user_competition.svg' },
    { label: 'Competition', icon: '/components/ic_user_competition.svg' },
];

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
    const activeItem = 'Menus';

    const renderItem = (item: { label: string; icon: string }) => {
        const isActive = item.label === activeItem;
        const Icon = item.icon;
        return (
            <button
                key={item.label}
                title={isCollapsed ? item.label : undefined}
                className={`
                    w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 
                    rounded-2xl text-sm font-semibold transition-all duration-200 group
                    ${isActive
                        ? 'bg-[#FFFFFF]  text-[#101828] shadow-sm'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                `}
            >
                <img
                    src={Icon}
                    className="w-5 h-5 flex-shrink-0 transition-all duration-200"
                    style={isActive
                        ? { filter: 'brightness(0) saturate(100%) invert(21%) sepia(93%) saturate(2048%) hue-rotate(203deg) brightness(95%) contrast(101%)' }
                        : { opacity: 0.7 }
                    }
                    alt={item.label}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#0051AF] text-white rounded-3xl overflow-hidden shadow-lg relative">
            {/* Logo area */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-8 bg-[#0051AF]`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-3 overflow-hidden ml-2">
                        <img src="/logo.svg" alt="Logo" className="h-8 object-contain" />
                    </div>
                )}
                <button
                    onClick={toggleCollapse}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Toggle sidebar"
                >
                    {isCollapsed ? <HiOutlineMenuAlt2 className="w-6 h-6 text-white" /> : <HiMenuAlt3 className="w-6 h-6 text-white" />}
                </button>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Group 1 */}
                <div className={`bg-[#FFFFFF]/5 rounded-3xl ${isCollapsed ? 'p-1.5' : 'p-2 py-3 mt-1'} space-y-1`}>
                    {sidebarItems.slice(0, 5).map(renderItem)}
                </div>

                {/* Group 2 */}
                <div className={`space-y-1 ${isCollapsed ? 'px-1.5' : 'px-2'}`}>
                    {sidebarItems.slice(5).map(renderItem)}
                </div>
            </nav>
        </div>
    );
}
