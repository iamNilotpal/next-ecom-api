const httpErrors = require('http-errors');
const productService = require('../services/product-service');
const userService = require('../services/user-service');
const cartService = require('../services/cart-service');
const UserDto = require('../dtos/user-dto');
const CartDto = require('../dtos/cart-dto');
const { ADD_TO_CART, REMOVE_FROM_CART } = require('../utils');

class CartController {
  async getCart(req, res, next) {
    try {
      const { cart: userCart } = req.user;

      if (userCart.cartItemsMeta.cartItemsCount === 0)
        return next(
          httpErrors.BadRequest({
            ok: false,
            cart: null,
          })
        );

      const cart = await cartService.getCartItems({
        customerId: req.user._id,
      });

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

  async updateCart(req, res, next) {
    try {
      const { productId, quantity, type } = req.body;
      if (!productId || !quantity || !type)
        return next(
          httpErrors.BadRequest('Missing product id, quantity and update type.')
        );

      if (![ADD_TO_CART, REMOVE_FROM_CART].includes(type))
        return next(httpErrors.BadRequest('Invalid update operation.'));

      cartService.checkUserCart(req.user);
      const cart = await cartService.updateCart({
        productId,
        quantity,
        type,
        customerId: req.user._id,
      });
      await userService.updateCartItem({
        user: req.user,
        cart,
        quantity,
        type,
      });

      return res.status(200).json({
        ok: true,
        cart: new CartDto(cart),
      });
    } catch (error) {
      console.log(error);

      if (!error.status) error.message = 'Failed to update cart.';
      next(error);
    }
  }

  async removeCartItem(req, res, next) {
    try {
      const { productId } = req.body;
      if (!productId) return next(httpErrors.BadRequest('Missing product id.'));

      cartService.checkUserCart(req.user);
      const cart = await cartService.removeCartItem(req.user._id, productId);
      await userService.updateCart(req.user, cart);

      return res.status(200).json({
        ok: true,
        cart: new CartDto(cart),
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}

module.exports = new CartController();
