/**
 * Image compression and processing utilities
 * Compresses images to base64 format while maintaining reasonable quality
 */

export interface CompressedImage {
  base64: string; // Data URL format: "data:image/jpeg;base64,..."
  originalSize: number; // Original file size in bytes
  compressedSize: number; // Compressed size in bytes
  compressionRatio: number; // Ratio of compression (e.g., 0.25 = 75% reduction)
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxWidth?: number; // Maximum width in pixels (default: 1920)
  maxHeight?: number; // Maximum height in pixels (default: 1920)
  quality?: number; // JPEG quality 0-1 (default: 0.7)
  outputFormat?: "image/jpeg" | "image/png"; // Output format (default: jpeg)
}

/**
 * Compress an image file to base64 with aggressive size reduction
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed image data
 */
export async function compressImageToBase64(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.7,
    outputFormat = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = Math.min(width, maxWidth);
            height = Math.round(width / aspectRatio);
          } else {
            height = Math.min(height, maxHeight);
            width = Math.round(height * aspectRatio);
          }
        }

        // Create canvas for compression
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const base64 = canvas.toDataURL(outputFormat, quality);

        // Calculate compressed size (base64 is ~33% larger than binary)
        const compressedSize = Math.round((base64.length * 3) / 4);
        const compressionRatio = compressedSize / originalSize;

        resolve({
          base64,
          originalSize,
          compressedSize,
          compressionRatio,
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Validate image file before compression
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  // Check file size (before compression)
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Image must be smaller than ${maxSizeMB}MB`,
    };
  }

  // Check supported formats
  const supportedFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (!supportedFormats.includes(file.type)) {
    return {
      valid: false,
      error: "Supported formats: JPEG, PNG, WebP",
    };
  }

  return { valid: true };
}
