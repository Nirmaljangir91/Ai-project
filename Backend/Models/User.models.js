const mongoose = require("mongoose");
const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
        unique: true,
        match: [/^\S+@\S+.\S+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        required: true,
        trim: true,
        min: 4,
        select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);