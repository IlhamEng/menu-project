import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/ui/Button';

describe('Button', () => {
    it('renders children text', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('fires onClick handler', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);
        fireEvent.click(screen.getByText('Click'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByText('Disabled')).toBeDisabled();
    });

    it('is disabled when isLoading is true', () => {
        render(<Button isLoading>Loading</Button>);
        expect(screen.getByText('Loading')).toBeDisabled();
    });

    it('shows spinner when loading', () => {
        const { container } = render(<Button isLoading>Loading</Button>);
        const svg = container.querySelector('svg.animate-spin');
        expect(svg).toBeInTheDocument();
    });

    it('applies primary variant styles by default', () => {
        render(<Button>Primary</Button>);
        const button = screen.getByText('Primary');
        expect(button.className).toContain('bg-[#0051AF]');
    });

    it('applies danger variant styles', () => {
        render(<Button variant="danger">Delete</Button>);
        const button = screen.getByText('Delete');
        expect(button.className).toContain('bg-red-600');
    });

    it('applies secondary variant styles', () => {
        render(<Button variant="secondary">Cancel</Button>);
        const button = screen.getByText('Cancel');
        expect(button.className).toContain('bg-white');
    });
});
