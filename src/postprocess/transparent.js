import sharp from 'sharp';

/**
 * Post-processing step: ensure PNG, normalize dimensions, and (best-effort) preserve alpha.
 *
 * NOTE: True background removal is non-trivial; for MVP we rely on the generator to produce a clean background.
 * You can later swap in a background removal model/service here.
 */
export async function normalizePng(buffer, { size }) {
  const img = sharp(buffer, { failOn: 'none' }).ensureAlpha();
  const out = await img
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return out;
}

export async function exportSizes(buffer, sizes) {
  const out = {};
  for (const size of sizes) {
    out[size] = await normalizePng(buffer, { size });
  }
  return out;
}
