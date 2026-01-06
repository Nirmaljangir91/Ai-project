const mongoose = require("mongoose");
const GenerationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "text-to-image",
        "text-to-video",
        "text-to-text",
        "text-to-speech",
        "image-to-image",
        "image-to-video",
        "video-to-video",
        "text-to-audio",
        "audio-to-text",
        "audio-generation",
      ],
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    inputImage: {
      type: String,
      default: null,
    },
    output: {
      type: String,
      required: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    modelUsed: {
      type: String,
      required: true,
      default: "default-model",
    },
    creditUsed: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    metadata: {
      type: Object,
      default: {},
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Generation", GenerationSchema);