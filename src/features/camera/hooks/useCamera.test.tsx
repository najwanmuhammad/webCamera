import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCamera } from './useCamera';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function streamFixture() {
  const track = {
    readyState: 'live',
    onended: null as (() => void) | null,
    stop() {
      this.readyState = 'ended';
    },
    getSettings() {
      return { deviceId: 'rear', facingMode: 'environment' };
    },
  };
  const stream = {
    active: true,
    getTracks: () => [track],
    getVideoTracks: () => [track],
  };
  return { track, stream: stream as unknown as MediaStream };
}
function setup(request: () => Promise<MediaStream>) {
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: request, enumerateDevices: async () => [] },
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  const hook = renderHook(() => useCamera());
  hook.result.current.videoRef.current = document.createElement('video');
  return hook;
}
describe('camera permissions and resource ownership', () => {
  it('keeps activation explicit and reports denied permission', async () => {
    const request = vi.fn(async () => {
      throw new DOMException('Denied', 'NotAllowedError');
    });
    const hook = setup(request);
    expect(request).not.toHaveBeenCalled();
    await act(async () => {
      await hook.result.current.start();
    });
    expect(hook.result.current.status).toBe('error');
    expect(hook.result.current.error).toContain('Izin kamera ditolak');
  });
  it('stops tracks and detaches the video on unmount', async () => {
    const fixture = streamFixture();
    const hook = setup(async () => fixture.stream);
    const video = hook.result.current.videoRef.current!;
    await act(async () => {
      await hook.result.current.start();
    });
    expect(video.srcObject).toBe(fixture.stream);
    hook.unmount();
    expect(fixture.track.readyState).toBe('ended');
    expect(video.srcObject).toBeNull();
  });
  it('immediately releases a permission response received after cancellation', async () => {
    const fixture = streamFixture();
    let resolve!: (stream: MediaStream) => void;
    const pending = new Promise<MediaStream>((done) => {
      resolve = done;
    });
    const hook = setup(() => pending);
    let operation!: Promise<void>;
    act(() => {
      operation = hook.result.current.start();
    });
    act(() => hook.result.current.stop());
    await act(async () => {
      resolve(fixture.stream);
      await operation;
    });
    expect(fixture.track.readyState).toBe('ended');
    expect(hook.result.current.status).toBe('idle');
  });
  it('stops the stream when the page is hidden', async () => {
    const fixture = streamFixture();
    const hook = setup(async () => fixture.stream);
    await act(async () => {
      await hook.result.current.start();
    });
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(fixture.track.readyState).toBe('ended');
    expect(hook.result.current.status).toBe('idle');
  });
});
