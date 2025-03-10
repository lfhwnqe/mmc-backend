export const ALLOWED_IMAGE_TYPES: string[] = [
  'image/jpeg', // JPG/JPEG
  'image/png',  // PNG
  'image/gif',  // GIF
  'image/webp', // WEBP
  'image/svg+xml', // SVG
  'image/bmp',  // BMP
  'image/tiff', // TIFF
];

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export interface UploadImageRequest {
  fileName: string;
  fileType: string;
  date: string; // 格式: YYYY-MM-DD
}

export interface UploadUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    key: string;
  };
}

export interface ImageUrlResponse {
  success: boolean;
  data: {
    url: string;
  };
} 