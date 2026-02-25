import Button from './Button';
import Modal from './Modal';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    isLoading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Delete',
    isLoading,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                    <HiOutlineExclamationTriangle className="w-7 h-7 text-red-600" />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed max-w-sm">{message}</p>
            </div>
            <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={onClose} className="flex-1">
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    isLoading={isLoading}
                    className="flex-1"
                >
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
