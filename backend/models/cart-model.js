const mongoose = require('mongoose');
const Joi = require('joi');
const { ProductSchema } = require('./product-model');

const ItemSchema = new mongoose.Schema(
  {
    ...ProductSchema,
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, min: 1, required: true },
    totalPrice: { type: Number, min: 0, required: true },
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },
    products: { type: [ItemSchema], required: true, default: [] },
    productsCount: { type: Number, min: 0, default: 0, required: true },
    subtotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CartValidation = Joi.object({
  id: Joi.ObjectId().required().label('Product id'),
  quantity: Joi.number().min(1).required().label('Product quantity'),
});

const Cart = mongoose.model('Cart', CartSchema);
module.exports = { Cart, CartValidation };
