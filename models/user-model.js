const mongoose = require('mongoose');
const Joi = require('joi');

/* Defines User Address */
const AddressSchema = new mongoose.Schema(
  {
    pincode: { type: Number, required: true },
    state: { type: String, required: true },
    town: { type: String, required: true },
  },
  { _id: false }
);

/* Defines Cart Items and Purchased Products */
const ItemsSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    count: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

/* Defines User Properties */
const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    address: { type: AddressSchema, required: true },
    cart: {
      cartItems: {
        type: [ItemsSchema],
        default: [],
      },
      cartItemsMeta: {
        cartId: {
          type: mongoose.Schema.Types.ObjectId,
          unique: true,
        },
        cartItemsCount: { type: Number, min: 0, default: 0 },
        subTotal: { type: Number, default: 0 },
      },
    },
    purchasedProducts: {
      purchasedItems: {
        type: [ItemsSchema],
        ref: 'Products',
        default: [],
      },
      purchasedProductsMeta: {
        purchasedItemsCount: { type: Number, min: 0, default: 0 },
        subTotal: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
);

const UserValidation = Joi.object({
  firstName: Joi.string().trim().required().label('First name'),
  lastName: Joi.string().trim().required().label('Last name'),
  email: Joi.string().email().trim().required().label('Email'),
  phone: Joi.string()
    .trim()
    .length(10)
    .pattern(/^[0-9]+$/)
    .label('Phone number')
    .messages({
      'string.pattern.base': 'Phone number must be valid.',
    })
    .required(),
  password: Joi.string().min(5).trim().required().label('Password'),
  address: Joi.object({
    pincode: Joi.string().trim().required().label('Pincode'),
    state: Joi.string().trim().required().label('State'),
    town: Joi.string().trim().required().label('Town'),
  })
    .messages({
      'object.base': 'Address must contain pincode, town and state.',
    })
    .required(),
});

const PersonalInfoValidation = Joi.object({
  firstName: Joi.string().trim().label('First name'),
  lastName: Joi.string().trim().label('Last name'),
  email: Joi.string().email().trim().label('Email'),
  phone: Joi.string()
    .trim()
    .length(10)
    .pattern(/^[0-9]+$/)
    .label('Phone number')
    .messages({
      'string.pattern.base': 'Phone number must be valid.',
    }),
  address: Joi.object({
    pincode: Joi.string().trim().label('Pincode'),
    state: Joi.string().trim().label('State'),
    town: Joi.string().trim().label('Town'),
  }).messages({
    'object.base': 'Address must contain pincode, town and state.',
  }),
});

const PasswordValidationSchema = Joi.object({
  oldPassword: Joi.string().trim().required().label('Old password'),
  newPassword: Joi.string().trim().min(5).required().label('New password'),
});

const User = mongoose.model('User', UserSchema);
module.exports = {
  User,
  UserValidation,
  PersonalInfoValidation,
  PasswordValidationSchema,
};
