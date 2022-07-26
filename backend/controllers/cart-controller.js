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
      /* If the meta details in user cart is empty that means user hasn't added
        anything to cart. In that case we can return null and don't to make any
        extra database query.
      */
      if (userCart.cartItemsMeta.cartItemsCount === 0)
        return res.status(200).json({
          success: true,
          cart: null,
        });

      const cart = await cartService.getCartItems({
        customerId: req.user._id,
      });

      return res.status(200).json({
        success: true,
        cart: new CartDto(cart),
      });
    } catch (error) {
      next(httpErrors.InternalServerError());
    }
  }

  async addToCart(req, res, next) {
    try {
      /* First validate the product details. If details are ok then find the product
        by the provided id. If product doesn't exist send 404 error.
      */
      const productInfo = await productService.validateProductInfo(req.body);
      const product = await productService.findProduct({
        _id: productInfo.productId,
      });
      if (!product) return next(httpErrors.NotFound('Product not found.'));

      /* Now add the product to user cart.*/
      const user = req.user;
      const cart = await cartService.addToCart(user, productInfo, product);
      await userService.addToCart(user, cart, productInfo);

      return res.status(200).json({
        success: true,
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

      // Check the update type
      if (![ADD_TO_CART, REMOVE_FROM_CART].includes(type))
        return next(httpErrors.BadRequest('Invalid update operation.'));

      // Chceck the user cart if it is empty throw 400 error
      cartService.checkUserCart(req.user);
      const data = { productId, type, quantity };

      // Update cart collection and user.cart metadata.
      const cart = await cartService.updateCart({
        customerId: req.user._id,
        ...data,
      });
      await userService.updateCartItem({
        user: req.user,
        cart,
        ...data,
      });

      return res.status(200).json({
        success: true,
        cart: new CartDto(cart),
      });
    } catch (error) {
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
      await userService.removeFromCart(req.user, cart, productId);

      return res.status(200).json({
        success: true,
        cart: new CartDto(cart),
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      if (req.user.cart.cartItemsMeta.cartItemsCount === 0)
        return next(httpErrors.BadRequest('Cart is already empty.'));

      await cartService.clearCart(req.user._id);
      await userService.clearCart(req.user);
      return res.status(200).json({
        success: true,
        cart: null,
        user: new UserDto(req.user),
      });
    } catch (error) {
      return next(httpErrors.InternalServerError('Error deleting cart items.'));
    }
  }
}

module.exports = new CartController();
