import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '../components/ui/Modal';

describe('Modal', () => {
    it('renders nothing when closed', () => {
        render(
            <Modal isOpen={false} onClose={() => { }} title="Test">
                <p>Content</p>
            </Modal>
        );
        expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });

    it('renders title and children when open', () => {
        render(
            <Modal isOpen={true} onClose={() => { }} title="Test Modal">
                <p>Modal Content</p>
            </Modal>
        );
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test">
                <p>Content</p>
            </Modal>
        );
        const closeButton = screen.getByLabelText('Close modal');
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on Escape key', async () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test">
                <p>Content</p>
            </Modal>
        );
        fireEvent.keyDown(window, { key: 'Escape' });
        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        });
    });
});
