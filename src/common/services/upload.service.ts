import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as sharp from 'sharp';

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
}

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

@Injectable()
export class UploadService {
  private s3: S3;
  private bucket: string;

  constructor(private configService: ConfigService) {
    console.log(this.configService.get('AWS_ACCESS_KEY_ID'));
    console.log(this.configService.get('AWS_SECRET_ACCESS_KEY'));
    console.log(this.configService.get('AWS_REGION'));
    console.log(this.configService.get('AWS_S3_BUCKET'));

    this.s3 = new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
    this.bucket = this.configService.get('AWS_S3_BUCKET');
  }

  /**
   * Upload a single file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    options?: { resize?: ImageResizeOptions },
  ): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${fileName}`;

      let buffer = file.buffer;
      let mimeType = file.mimetype;

      // Resize image if options provided and file is an image
      if (options?.resize && this.isImage(file.mimetype)) {
        const resizeResult = await this.resizeImage(buffer, options.resize);
        buffer = resizeResult.buffer;
        mimeType = resizeResult.mimeType;
      }

      // Upload to S3
      const uploadParams: S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read',
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      };

      const result = await this.s3.upload(uploadParams).promise();

      return {
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        size: buffer.length,
        mimeType,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  /**
   * Upload multiple files to S3
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
    options?: { resize?: ImageResizeOptions },
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folder, options),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Upload user avatar with automatic resizing
   */
  async uploadAvatar(file: Express.Multer.File): Promise<UploadResult> {
    if (!this.isImage(file.mimetype)) {
      throw new BadRequestException('Avatar must be an image file');
    }

    return this.uploadFile(file, 'avatars', {
      resize: {
        width: 300,
        height: 300,
        quality: 85,
        format: 'jpeg',
      },
    });
  }

  /**
   * Upload store logo with automatic resizing
   */
  async uploadStoreLogo(file: Express.Multer.File): Promise<UploadResult> {
    if (!this.isImage(file.mimetype)) {
      throw new BadRequestException('Store logo must be an image file');
    }

    return this.uploadFile(file, 'store-logos', {
      resize: {
        width: 400,
        height: 400,
        quality: 90,
        format: 'png',
      },
    });
  }

  /**
   * Upload store cover image with automatic resizing
   */
  async uploadStoreCover(file: Express.Multer.File): Promise<UploadResult> {
    if (!this.isImage(file.mimetype)) {
      throw new BadRequestException('Store cover must be an image file');
    }

    return this.uploadFile(file, 'store-covers', {
      resize: {
        width: 1200,
        height: 600,
        quality: 85,
        format: 'jpeg',
      },
    });
  }

  /**
   * Upload chat message attachment
   */
  async uploadChatAttachment(file: Express.Multer.File): Promise<UploadResult> {
    const folder = this.isImage(file.mimetype) ? 'chat-images' : 'chat-files';

    const options = this.isImage(file.mimetype)
      ? {
          resize: {
            width: 800,
            height: 600,
            quality: 80,
            format: 'jpeg' as const,
          },
        }
      : undefined;

    return this.uploadFile(file, folder, options);
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${error.message}`,
      );
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteFiles(keys: string[]): Promise<void> {
    try {
      if (keys.length === 0) return;

      await this.s3
        .deleteObjects({
          Bucket: this.bucket,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
          },
        })
        .promise();
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete files: ${error.message}`,
      );
    }
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      return this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Check allowed file types
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }
  }

  /**
   * Check if file is an image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Resize image using Sharp
   */
  private async resizeImage(
    buffer: Buffer,
    options: ImageResizeOptions,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      let sharpInstance = sharp(buffer);

      // Resize if dimensions provided
      if (options.width || options.height) {
        sharpInstance = sharpInstance.resize(options.width, options.height, {
          fit: 'cover',
          position: 'center',
        });
      }

      // Set format and quality
      const format = options.format || 'jpeg';
      const quality = options.quality || 85;

      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality });
          break;
      }

      const resizedBuffer = await sharpInstance.toBuffer();
      const mimeType = `image/${format}`;

      return { buffer: resizedBuffer, mimeType };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to resize image: ${error.message}`,
      );
    }
  }
}
