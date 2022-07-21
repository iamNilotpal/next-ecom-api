const mongoose = require('mongoose');
const joi = require('joi');

const AddressSchema = new mongoose.Schema(
  {
    pin: { type: Number, required: true },
    state: { type: String, required: true },
    town: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    address: { type: AddressSchema, required: true },
    cart: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Cart',
      default: [],
    },
    purchasedItems: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Products',
      default: [],
    },
  },
  { timestamps: true }
);

const UserValidation = joi.object({
  firstName: joi.string().trim().required(),
  lastName: joi.string().trim().required(),
  email: joi.string().email().trim().required(),
  password: joi.string().min(5).trim().required(),
  address: joi
    .object({
      pin: joi.string().trim().required(),
      state: joi.string().trim().required(),
      town: joi.string().trim().required(),
    })
    .required(),
});

const User = mongoose.model('User', UserSchema);
module.exports = { User, UserValidation };
