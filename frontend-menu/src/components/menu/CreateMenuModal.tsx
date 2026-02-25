import { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useMenuStore } from '../../store/useMenuStore';
import toast from 'react-hot-toast';

interface CreateMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: number | null;
}

export default function CreateMenuModal({ isOpen, onClose, parentId }: CreateMenuModalProps) {
    const { createMenu, findMenuById, expandedIds } = useMenuStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const parentMenu = parentId !== null ? findMenuById(parentId) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!name.trim()) {
            setErrors({ name: 'Name is required' });
            return;
        }

        if (name.trim().length > 255) {
            setErrors({ name: 'Name must be 255 characters or less' });
            return;
        }

        setIsSubmitting(true);
        try {
            await createMenu({
                name: name.trim(),
                description: description.trim() || undefined,
                parent_id: parentId ?? undefined,
            });

            // Auto-expand the parent so the new child is visible
            if (parentId !== null && !expandedIds.has(parentId)) {
                useMenuStore.getState().toggleExpand(parentId);
            }

            toast.success('Menu created successfully');
            handleClose();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
                if (axiosErr.response?.data?.errors) {
                    setErrors(axiosErr.response.data.errors);
                } else {
                    toast.error(axiosErr.response?.data?.message || 'Failed to create menu');
                }
            } else {
                toast.error('Failed to create menu');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Menu">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Parent info */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Parent</label>
                    <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-600">
                        {parentMenu ? parentMenu.name : '(Root Level)'}
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`
              w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all
              ${errors.name ? 'border-red-300' : 'border-gray-200'}
            `}
                        placeholder="Enter menu name"
                        autoFocus
                        maxLength={255}
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                    )}
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

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={handleClose} className="flex-1" type="button">
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} className="flex-1">
                        Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
