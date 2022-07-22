const productService = require('../services/product-service');

class ProductsController {
  async allProducts(req, res, next) {
    try {
      const products = await productService.allProducts();
      return res.status(200).json({
        ok: true,
        products,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        statusCode: 500,
        error: "Something went wrong. Can't get all products.",
      });
    }
  }
}

module.exports = new ProductsController();
