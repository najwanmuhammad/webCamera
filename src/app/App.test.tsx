// Prepared for execution after M5; not run during M1 at the user's request.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useCameraStore } from '@/features/camera/store/camera-store';
import { usePhotoStore } from '@/features/editor/store/photo-store';

describe('camera entry', () => {
  beforeEach(() => {
    usePhotoStore.getState().clearPhoto();
    useCameraStore.setState({ aspectRatio: '3:4' });
    render(<App />);
  });
  it('shows a camera activation action without requiring permission on mount', () => {
    expect(
      screen.getByRole('main', { name: 'GeoStamp Camera' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kamera' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Aktifkan kamera' }),
    ).toBeEnabled();
  });
  it('allows gallery access before the camera is active and guards the shutter', () => {
    expect(screen.getByRole('button', { name: 'Buka galeri' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Ambil foto' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ganti kamera' })).toBeDisabled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('explains offline limitations without blocking the gallery workflow', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    fireEvent(window, new Event('offline'));
    expect(screen.getByText(/Anda sedang offline/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buka galeri' })).toBeEnabled();
  });
  it('defaults to 3:4 and exposes ratio selection accessibly', async () => {
    const user = userEvent.setup();
    expect(screen.getByRole('button', { name: '3:4' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: '9:16' }));
    expect(screen.getByRole('button', { name: '9:16' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '3:4' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
