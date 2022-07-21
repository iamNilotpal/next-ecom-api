const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    image: String,
    rating: { rate: String, count: Number },
  },
  { timestamps: true }
);

const Product = mongoose.model('Products', ProductSchema);
module.exports = { Product, ProductSchema: ProductSchema.obj };
