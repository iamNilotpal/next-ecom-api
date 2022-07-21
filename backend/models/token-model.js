const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, unique: true, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const RefreshToken = mongoose.model(
  'RefreshTokens',
  RefreshTokenSchema,
  'tokens'
);
module.exports = RefreshToken;
