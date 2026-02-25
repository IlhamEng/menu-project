import { useState, useEffect } from 'react';
import { useMenuStore } from '../../store/useMenuStore';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function MenuDetail() {
    const { selectedMenu, updateMenu, deleteMenu, moveMenu, getDepth, getAllMenusFlat, isDescendantOf } = useMenuStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Sync form with selection
    useEffect(() => {
        if (selectedMenu) {
            setName(selectedMenu.name);
            setDescription(selectedMenu.description ?? '');
        }
    }, [selectedMenu]);

    if (!selectedMenu) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mb-4">
                    <img src="/components/ic_system_grey.svg" alt="System" />
                </div>
                <p className="text-sm font-medium text-gray-500">Select a menu item</p>
                <p className="text-xs text-gray-400 mt-1">Click on an item in the tree to view details</p>
            </div>
        );
    }

    const depth = getDepth(selectedMenu.id);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        setIsSaving(true);
        try {
            await updateMenu(selectedMenu.id, {
                name: name.trim(),
                description: description.trim() || undefined,
            });
            toast.success('Menu updated successfully');
        } catch {
            toast.error('Failed to update menu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteMenu(selectedMenu.id);
            toast.success('Menu deleted successfully');
            setShowDeleteConfirm(false);
        } catch {
            toast.error('Failed to delete menu');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMove = async (newParentId: number | null) => {
        if (isMoving) return;
        setIsMoving(true);
        try {
            await moveMenu(selectedMenu.id, { parent_id: newParentId });
            toast.success('Menu moved successfully');
        } catch {
            toast.error('Failed to move menu');
        } finally {
            setIsMoving(false);
        }
    };

    // Build move options: all menus except self and descendants
    const allMenus = getAllMenusFlat();
    const moveOptions = allMenus.filter(
        (m) => m.id !== selectedMenu.id && !isDescendantOf(selectedMenu.id, m.id)
    );

    return (
        <div className="space-y-5">
            {/* Menu ID */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Menu ID</label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-600 font-mono">
                    {selectedMenu.id}
                </div>
            </div>

            {/* Depth */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Depth</label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-600">
                    {depth}
                </div>
            </div>

            {/* Parent Data — Dropdown to move */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Parent Data</label>
                <select
                    value={selectedMenu.parent_id ?? ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        const newParentId = val === '' ? null : Number(val);
                        handleMove(newParentId);
                    }}
                    disabled={isMoving}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer disabled:opacity-50"
                >
                    <option value="">(Root Level)</option>
                    {moveOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                            {'—'.repeat(m.depth)} {m.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Name */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    placeholder="Enter menu name"
                    maxLength={255}
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                    rows={3}
                    placeholder="Enter description (optional)"
                    maxLength={1000}
                />
            </div>

            {/* Save button */}
            <Button onClick={handleSave} isLoading={isSaving} className="w-full" size="full">
                Save
            </Button>

            {/* Delete button */}
            <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                size="full"
            >
                Delete Menu
            </Button>

            {/* Delete confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Menu"
                message={`Are you sure you want to delete "${selectedMenu.name}"? This will also delete all child menus. This action cannot be undone.`}
                confirmLabel="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
}
