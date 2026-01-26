const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  generationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Generation',
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  resolution: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    quality: {
      type: String,
      enum: ['480p', '720p', '1080p', '4k']
    }
  },
  format: {
    type: String,
    enum: ['mp4', 'mov', 'webm', 'avi'],
    default: 'mp4'
  },
  fps: {
    type: Number,
    default: 24
  },
  codec: {
    type: String,
    default: 'H.264'
  },
  bitrate: {
    type: Number // in kbps
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['private', 'unlisted', 'public'],
    default: 'private'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    }
  },
  storage: {
    provider: {
      type: String,
      enum: ['aws-s3', 'cloudinary', 'google-cloud', 'azure'],
      required: true
    },
    bucketName: String,
    key: String,
    region: String,
    cdnUrl: String
  },
  watermark: {
    enabled: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']
    }
  },
  expiresAt: {
    type: Date // For temporary videos
  },
  deletedAt: {
    type: Date // Soft delete
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    originalPrompt: String,
    generationSettings: mongoose.Schema.Types.Mixed,
    processingTime: Number,
    aiModel: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ userId: 1, isDeleted: 1 });
videoSchema.index({ projectId: 1 });
videoSchema.index({ visibility: 1, createdAt: -1 });
videoSchema.index({ tags: 1 });

// Virtual for formatted file size
videoSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for formatted duration
videoSchema.virtual('formattedDuration').get(function() {
  const seconds = this.duration;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
});

// Method to increment views
videoSchema.methods.incrementViews = async function() {
  this.stats.views += 1;
  return await this.save();
};

// Method to increment downloads
videoSchema.methods.incrementDownloads = async function() {
  this.stats.downloads += 1;
  return await this.save();
};

// Method to soft delete
videoSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

// Static method to get user's storage usage
videoSchema.statics.getUserStorageUsage = async function(userId) {
  const result = await this.aggregate([
    {
      $match: { 
        userId: mongoose.Types.ObjectId(userId),
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$fileSize' },
        videoCount: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalSize: 0, videoCount: 0 };
};

// Enable virtuals in JSON
videoSchema.set('toJSON', { virtuals: true });
videoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Video', videoSchema);