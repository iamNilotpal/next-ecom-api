const productService = require('../services/product-service');
const httpErrors = require('http-errors');

class ProductsController {
  async allProducts(req, res, next) {
    try {
      const products = await productService.allProducts();
      return res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(
        httpErrors.InternalServerError(
          "Something went wrong. Can't get all products."
        )
      );
    }
  }
}

module.exports = new ProductsController();
