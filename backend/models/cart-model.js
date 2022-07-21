const mongoose = require('mongoose');
const Joi = require('joi');
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

const CartValidation = Joi.object({
  product: Joi.object({
    name: Joi.string().trim().required().label('Product name'),
    description: Joi.string().trim().required().label('Product description'),
    price: Joi.number().required().label('Product price'),
    image: Joi.string().uri().trim().required().label('Product image'),
    rating: Joi.object({
      rate: Joi.number().required().label('Product rate'),
      count: Joi.number().required().label('Product rate count'),
    })
      .messages({ 'object.base': 'Product ratings are required.' })
      .required(),
    quantity: Joi.number().min(1).required().label('Product quantity'),
  })
    .required()
    .label('Product'),
});

const Cart = mongoose.model('Cart', CartSchema);
module.exports = { Cart, CartValidation };
