const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    enum: [
      'abstract',
      'nature',
      'urban',
      'animation',
      'cinematic',
      'product',
      'social-media',
      'educational',
      'promotional',
      'artistic',
      'other'
    ],
    required: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  previewUrl: {
    type: String,
    required: true
  },
  previewThumbnail: {
    type: String
  },
  previewGif: {
    type: String
  },
  style: {
    type: String,
    enum: [
      'realistic',
      'anime',
      'cartoon',
      '3d-render',
      'pixel-art',
      'watercolor',
      'oil-painting',
      'sketch',
      'cinematic',
      'futuristic',
      'vintage',
      'minimalist'
    ],
    default: 'realistic'
  },
  defaultSettings: {
    resolution: {
      type: String,
      enum: ['480p', '720p', '1080p', '4k'],
      default: '720p'
    },
    duration: {
      type: Number,
      default: 5,
      min: 1,
      max: 60
    },
    fps: {
      type: Number,
      default: 24,
      enum: [24, 30, 60]
    },
    aspectRatio: {
      type: String,
      enum: ['16:9', '9:16', '1:1', '4:3'],
      default: '16:9'
    },
    guidanceScale: {
      type: Number,
      default: 7.5,
      min: 1,
      max: 20
    },
    steps: {
      type: Number,
      default: 30,
      min: 10,
      max: 100
    }
  },
  promptTemplate: {
    type: String,
    required: true,
    maxlength: 2000
  },
  negativePromptTemplate: {
    type: String,
    maxlength: 1000
  },
  variables: [{
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'color', 'boolean'],
      required: true
    },
    defaultValue: mongoose.Schema.Types.Mixed,
    options: [String], // For select type
    placeholder: String,
    description: String,
    required: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isOfficial: {
    type: Boolean,
    default: false
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  credits: {
    type: Number,
    default: 10,
    min: 1
  },
  stats: {
    uses: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  trending: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    modelVersion: String,
    lastUpdated: Date,
    version: {
      type: String,
      default: '1.0'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
templateSchema.index({ category: 1, isPublic: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ featured: 1, 'stats.uses': -1 });
templateSchema.index({ trending: 1, createdAt: -1 });
templateSchema.index({ isPremium: 1 });

// Method to increment uses
templateSchema.methods.incrementUses = async function() {
  this.stats.uses += 1;
  return await this.save();
};

// Method to add rating
templateSchema.methods.addRating = async function(rating) {
  const totalRating = (this.stats.rating * this.stats.ratingCount) + rating;
  this.stats.ratingCount += 1;
  this.stats.rating = totalRating / this.stats.ratingCount;
  return await this.save();
};

// Method to like template
templateSchema.methods.like = async function() {
  this.stats.likes += 1;
  return await this.save();
};

// Method to unlike template
templateSchema.methods.unlike = async function() {
  if (this.stats.likes > 0) {
    this.stats.likes -= 1;
    return await this.save();
  }
  return this;
};

// Method to populate prompt with variables
templateSchema.methods.populatePrompt = function(variables = {}) {
  let prompt = this.promptTemplate;
  
  // Replace variables in template
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    prompt = prompt.replace(regex, variables[key]);
  });
  
  return prompt;
};

// Static method to get trending templates
templateSchema.statics.getTrending = async function(limit = 10) {
  return await this.find({ 
    isPublic: true, 
    isActive: true 
  })
  .sort({ 'stats.uses': -1, createdAt: -1 })
  .limit(limit)
  .exec();
};

// Static method to get featured templates
templateSchema.statics.getFeatured = async function(limit = 10) {
  return await this.find({ 
    featured: true,
    isPublic: true,
    isActive: true
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .exec();
};

// Static method to search templates
templateSchema.statics.search = async function(query, filters = {}) {
  const searchCriteria = {
    isPublic: true,
    isActive: true,
    ...filters
  };
  
  if (query) {
    searchCriteria.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } }
    ];
  }
  
  return await this.find(searchCriteria)
    .sort({ 'stats.uses': -1 })
    .exec();
};

module.exports = mongoose.model('Template', templateSchema);