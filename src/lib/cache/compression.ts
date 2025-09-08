import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Compress string using gzip
 */
export async function compress(data: string): Promise<string> {
  try {
    const compressed = await gzipAsync(Buffer.from(data, 'utf-8'));
    return compressed.toString('base64');
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
}

/**
 * Decompress string from gzip
 */
export async function decompress(data: string): Promise<string> {
  try {
    const buffer = Buffer.from(data, 'base64');
    const decompressed = await gunzipAsync(buffer);
    return decompressed.toString('utf-8');
  } catch (error) {
    console.error('Decompression error:', error);
    throw error;
  }
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(original: string, compressed: string): number {
  const originalSize = Buffer.byteLength(original, 'utf-8');
  const compressedSize = Buffer.byteLength(compressed, 'base64');
  return 1 - (compressedSize / originalSize);
}