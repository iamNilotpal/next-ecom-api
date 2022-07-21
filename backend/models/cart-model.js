const mongoose = require('mongoose');
const joi = require('joi');
const { ProductSchema } = require('./product-model');

const ItemSchema = new mongoose.Schema(
  {
    ...ProductSchema,
    quantity: { type: Number, min: 1, required: true },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'purchased'],
      default: 'active',
      required: true,
    },
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: { type: [ItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CartValidation = joi.object({
  product: joi
    .object({
      name: joi.string().trim().required(),
      description: joi.string().trim().required(),
      price: joi.number().required(),
      image: joi.string().uri().trim().required(),
      rating: joi
        .object({
          rate: joi.number().required(),
          couunt: joi.number().required(),
        })
        .required(),
      quantity: joi.number().min(1).required(),
    })
    .required(),
});

const Cart = mongoose.model('Cart', CartSchema);
module.exports = { Cart, CartValidation };
