// Deferred: run browser tests only after M5, per user instruction.
import { expect, test } from '@playwright/test';

for (const width of [320, 375, 390, 430, 1280]) {
  test(`shell fits and stays centered at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const shell = page.getByRole('main', { name: 'GeoStamp Camera' });
    await expect(shell).toBeVisible();
    const box = await shell.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(Math.min(width, 430));
    expect(box!.x).toBe((width - Math.min(width, 430)) / 2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const preview = page.getByRole('group', {
      name: 'Pratinjau kamera',
    });
    const initial = await preview.boundingBox();
    expect(initial!.width / initial!.height).toBeCloseTo(3 / 4, 2);
    await page.getByRole('button', { name: '9:16' }).click();
    const tall = await preview.boundingBox();
    expect(tall!.width / tall!.height).toBeCloseTo(9 / 16, 2);
    await page
      .getByRole('button', { name: 'Ambil foto' })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('button', { name: 'Ambil foto' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test('entry screen does not request camera or GPS access', async ({ page }) => {
  await page.addInitScript(() => {
    const calls: string[] = [];
    Object.assign(window, { hardwareCalls: calls });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () => {
          calls.push('camera');
          return Promise.reject(new Error('Unexpected camera request'));
        },
      },
    });
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: () => calls.push('gps'),
        watchPosition: () => calls.push('gps-watch'),
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '9:16' }).click();
  expect(
    await page.evaluate(
      () => (window as Window & { hardwareCalls?: string[] }).hardwareCalls,
    ),
  ).toEqual([]);
});
