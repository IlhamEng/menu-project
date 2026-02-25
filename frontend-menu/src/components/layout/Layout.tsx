import { useState, useEffect, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu when screen resizes to large
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen bg-[#F0F2F5] overflow-hidden font-sans">
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden transition-opacity backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
                    lg:relative lg:translate-x-0
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${isCollapsed ? 'lg:w-[104px]' : 'lg:w-[296px]'}
                    w-[296px]
                    p-4 lg:pr-0 h-full flex-shrink-0
                `}
            >
                {/* On mobile, force isCollapsed to false so it shows full labels */}
                <Sidebar
                    isCollapsed={isMobileOpen ? false : isCollapsed}
                    toggleCollapse={() => {
                        // On mobile, the toggle button in sidebar closes the sidebar
                        if (window.innerWidth < 1024) {
                            setIsMobileOpen(false);
                        } else {
                            setIsCollapsed(!isCollapsed);
                        }
                    }}
                />
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Mobile header (Only visible when sidebar is closed on mobile) */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 z-30 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileOpen(true)}
                            className="p-2 -ml-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                            aria-label="Open Menu"
                        >
                            <HiOutlineMenuAlt2 className="w-5 h-5 text-gray-700" />
                        </button>
                        <div className="flex items-center gap-2">
                            <img src="/logo.svg" alt="CLOIT" className="h-6 object-contain" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
