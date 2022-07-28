const { CartValidation } = require('../models/cart-model');
const { Product } = require('../models/product-model');
const { JoiValidateOptions } = require('../constants');

class ProductService {
  async allProducts() {
    return Product.find({}).lean().exec();
  }

  createNewProduct(storedProduct, productInfo) {
    return {
      ...storedProduct,
      productId: storedProduct._id,
      quantity: productInfo.quantity,
      totalPrice: productInfo.quantity * storedProduct.price,
    };
  }

  async validateProductInfo(product) {
    return CartValidation.validateAsync(product, JoiValidateOptions);
  }

  async findProduct(filter) {
    return Product.findById(filter).lean().exec();
  }
}

module.exports = new ProductService();
