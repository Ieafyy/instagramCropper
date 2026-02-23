import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { __qualityTestUtils } from '../src/utils/imageAnalysis.js';

function createImageDataLike(
  width: number,
  height: number,
  pixelFn: (x: number, y: number) => [number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  let idx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      data[idx++] = r;
      data[idx++] = g;
      data[idx++] = b;
      data[idx++] = 255;
    }
  }

  return { width, height, data } as ImageData;
}

test('flags near-white image as critical overexposure', () => {
  const imageData = createImageDataLike(64, 64, () => [255, 255, 255]);
  const result = __qualityTestUtils.analyzeFromImageData(imageData);

  assert.equal(result.level, 'critical');
  assert.ok(result.exposure.overexposedPct >= 99);
});

test('flags near-black image as critical underexposure', () => {
  const imageData = createImageDataLike(64, 64, () => [0, 0, 0]);
  const result = __qualityTestUtils.analyzeFromImageData(imageData);

  assert.equal(result.level, 'critical');
  assert.ok(result.exposure.underexposedPct >= 99);
});

test('flags flat gray image as warning or critical because of low contrast', () => {
  const imageData = createImageDataLike(64, 64, () => [128, 128, 128]);
  const result = __qualityTestUtils.analyzeFromImageData(imageData);

  assert.notEqual(result.level, 'ok');
  assert.ok(result.contrast.dynamicRangeNorm < 0.3);
});

test('high-frequency pattern keeps sharpness above blur baseline', () => {
  const detailed = createImageDataLike(64, 64, (x, y) => {
    const tone = (x + y) % 2 === 0 ? 80 : 160;
    return [tone, tone, tone];
  });
  const blurred = createImageDataLike(64, 64, () => [120, 120, 120]);

  const detailedResult = __qualityTestUtils.analyzeFromImageData(detailed);
  const blurredResult = __qualityTestUtils.analyzeFromImageData(blurred);

  assert.ok(detailedResult.sharpness.laplacianVariance > blurredResult.sharpness.laplacianVariance);
});

test('slide with high upsample ratio is critical', () => {
  const imageData = createImageDataLike(64, 64, (x, y) => {
    const tone = (x + y) % 2 === 0 ? 100 : 150;
    return [tone, tone, tone];
  });

  const result = __qualityTestUtils.analyzeFromImageData(imageData, {
    sourceCropPixels: 720,
    upsampleRatio: 1.5,
  });

  assert.equal(result.level, 'critical');
  assert.ok(result.resolution);
  assert.ok(result.resolution!.upsampleRatio > 1.4);
});

test('score is always clamped to [0, 100]', () => {
  const white = createImageDataLike(64, 64, () => [255, 255, 255]);
  const dark = createImageDataLike(64, 64, () => [0, 0, 0]);
  const mid = createImageDataLike(64, 64, () => [127, 127, 127]);

  const results = [
    __qualityTestUtils.analyzeFromImageData(white),
    __qualityTestUtils.analyzeFromImageData(dark),
    __qualityTestUtils.analyzeFromImageData(mid),
  ];

  for (const result of results) {
    assert.ok(result.score >= 0);
    assert.ok(result.score <= 100);
  }
});
