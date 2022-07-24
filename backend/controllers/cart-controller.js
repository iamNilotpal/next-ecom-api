const httpErrors = require('http-errors');
const productService = require('../services/product-service');
const userService = require('../services/user-service');
const cartService = require('../services/cart-service');
const UserDto = require('../dtos/user-dto');
const CartDto = require('../dtos/cart-dto');

class CartController {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCartItems({
        customerId: req.user._id,
      });

      cart.products = cart.products.filter((p) => p.isActive);
      return res.status(200).json({
        ok: true,
        cart: new CartDto(cart),
      });
    } catch (error) {
      console.log(error);
      next(httpErrors.InternalServerError());
    }
  }

  async addToCart(req, res, next) {
    try {
      const productInfo = await productService.validateProductInfo(req.body);
      const product = await productService.findProduct({ _id: productInfo.id });
      if (!product) return next(httpErrors.NotFound('Product not found.'));

      const user = req.user;
      const cart = await cartService.addToCart(user, productInfo, product);
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

module.exports = new CartController();
