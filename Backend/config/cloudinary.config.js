const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Storage configuration for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: `ai-videos/${req.user.id}`, // Organize by user ID
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto'
        }
      ],
      // Generate thumbnail automatically
      eager: [
        {
          width: 400,
          height: 300,
          crop: 'fill',
          format: 'jpg'
        }
      ],
      eager_async: true,
      // Add tags for organization
      tags: ['ai-generated', req.user.id],
      // Set access mode
      type: 'upload',
      access_mode: 'public'
    };
  }
});

// Storage configuration for images (thumbnails, watermarks)
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ai-videos/images',
    allowed_formats: ['jpg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto' }]
  }
});

// Multer upload instances
const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  }
});

// Utility functions
const cloudinaryUtils = {
  /**
   * Upload video to Cloudinary
   */
  uploadVideo: async (filePath, options = {}) => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: options.folder || 'ai-videos',
        ...options
      });
      
      return result;
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  },

  /**
   * Upload video from buffer
   */
  uploadVideoFromBuffer: (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: options.folder || 'ai-videos',
          ...options
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(buffer);
    });
  },

  /**
   * Delete video from Cloudinary
   */
  deleteVideo: async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
        invalidate: true
      });
      
      return result;
    } catch (error) {
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  },

  /**
   * Generate thumbnail from video
   */
  generateThumbnail: async (publicId, time = 0) => {
    try {
      const url = cloudinary.url(publicId, {
        resource_type: 'video',
        transformation: [
          {
            start_offset: time,
            width: 400,
            height: 300,
            crop: 'fill',
            format: 'jpg'
          }
        ]
      });
      
      return url;
    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  },

  /**
   * Get video info from Cloudinary
   */
  getVideoInfo: async (publicId) => {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'video'
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  },

  /**
   * Apply transformations to video
   */
  transformVideo: async (publicId, transformations) => {
    try {
      const url = cloudinary.url(publicId, {
        resource_type: 'video',
        transformation: transformations
      });
      
      return url;
    } catch (error) {
      throw new Error(`Video transformation failed: ${error.message}`);
    }
  },

  /**
   * Create video archive
   */
  createArchive: async (publicIds, options = {}) => {
    try {
      const result = await cloudinary.uploader.create_archive({
        resource_type: 'video',
        public_ids: publicIds,
        ...options
      });
      
      return result;
    } catch (error) {
      throw new Error(`Archive creation failed: ${error.message}`);
    }
  },

  /**
   * Get usage statistics
   */
  getUsage: async () => {
    try {
      const result = await cloudinary.api.usage();
      return result;
    } catch (error) {
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }
  },

  /**
   * Search videos
   */
  searchVideos: async (expression, options = {}) => {
    try {
      const result = await cloudinary.search
        .expression(expression)
        .with_field('context')
        .with_field('tags')
        .max_results(options.maxResults || 30)
        .execute();
      
      return result;
    } catch (error) {
      throw new Error(`Video search failed: ${error.message}`);
    }
  },

  /**
   * Add watermark to video
   */
  addWatermark: (videoPublicId, watermarkPublicId, options = {}) => {
    const {
      position = 'bottom_right',
      opacity = 50,
      width = 100
    } = options;
    
    return cloudinary.url(videoPublicId, {
      resource_type: 'video',
      transformation: [
        {
          overlay: watermarkPublicId,
          gravity: position,
          opacity: opacity,
          width: width
        }
      ]
    });
  }
};

module.exports = {
  cloudinary,
  uploadVideo,
  uploadImage,
  cloudinaryUtils
};