const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  thumbnail: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
  }],
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  settings: {
    defaultResolution: {
      type: String,
      enum: ['480p', '720p', '1080p', '4k'],
      default: '1080p'
    },
    defaultVisibility: {
      type: String,
      enum: ['private', 'unlisted', 'public'],
      default: 'private'
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalVideos: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // in seconds
    },
    totalSize: {
      type: Number,
      default: 0 // in bytes
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
projectSchema.index({ userId: 1, status: 1, createdAt: -1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ 'collaborators.userId': 1 });

// Method to add video to project
projectSchema.methods.addVideo = async function(videoId) {
  if (!this.videos.includes(videoId)) {
    this.videos.push(videoId);
    this.stats.totalVideos += 1;
    this.stats.lastActivity = new Date();
    return await this.save();
  }
  return this;
};

// Method to remove video from project
projectSchema.methods.removeVideo = async function(videoId) {
  const index = this.videos.indexOf(videoId);
  if (index > -1) {
    this.videos.splice(index, 1);
    this.stats.totalVideos -= 1;
    this.stats.lastActivity = new Date();
    return await this.save();
  }
  return this;
};

// Method to add collaborator
projectSchema.methods.addCollaborator = async function(userId, role = 'viewer') {
  const existing = this.collaborators.find(c => c.userId.equals(userId));
  
  if (!existing) {
    this.collaborators.push({
      userId: userId,
      role: role,
      addedAt: new Date()
    });
    return await this.save();
  }
  return this;
};

// Method to remove collaborator
projectSchema.methods.removeCollaborator = async function(userId) {
  this.collaborators = this.collaborators.filter(c => !c.userId.equals(userId));
  return await this.save();
};

// Method to update collaborator role
projectSchema.methods.updateCollaboratorRole = async function(userId, newRole) {
  const collaborator = this.collaborators.find(c => c.userId.equals(userId));
  
  if (collaborator) {
    collaborator.role = newRole;
    return await this.save();
  }
  return this;
};

// Method to archive project
projectSchema.methods.archive = async function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return await this.save();
};

// Method to restore archived project
projectSchema.methods.restore = async function() {
  this.status = 'active';
  this.archivedAt = null;
  return await this.save();
};

// Static method to get user's projects with stats
projectSchema.statics.getUserProjectsWithStats = async function(userId, status = 'active') {
  return await this.find({ 
    userId: userId,
    status: status 
  })
  .populate('videos', 'title thumbnailUrl duration fileSize')
  .sort({ 'stats.lastActivity': -1 })
  .exec();
};

// Update stats before saving
projectSchema.pre('save', async function(next) {
  if (this.isModified('videos')) {
    // Recalculate stats when videos array is modified
    const Video = mongoose.model('Video');
    const videos = await Video.find({ _id: { $in: this.videos } });
    
    this.stats.totalVideos = videos.length;
    this.stats.totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);
    this.stats.totalSize = videos.reduce((sum, v) => sum + v.fileSize, 0);
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);