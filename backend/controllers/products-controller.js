const httpErrors = require('http-errors');
const productService = require('../services/product-service');
const userService = require('../services/user-service');
const UserDto = require('../dtos/user-dto');

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

  async addToCart(req, res, next) {
    try {
      const productInfo = await productService.validateProductInfo(req.body);
      const product = await productService.findProduct({ _id: productInfo.id });
      if (!product) return next(httpErrors.NotFound('Product not found.'));

      const user = req.user;
      const cart = await productService.addToCart(user, productInfo, product);
      await userService.addToCart(user, cart, productInfo.quantity);

      return res.status(200).json({
        ok: true,
        user: new UserDto(user),
      });
    } catch (error) {
      if (error.isJoi) error.status = 400;
      else error.message = 'Error while adding to cart.';
      next(error);
    }
  }
}

module.exports = new ProductsController();
