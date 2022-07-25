const { ADD_TO_CART } = require('../utils');

class UserService {
  async addToCart(user, cart, productInfo) {
    //  First find the cart item in user cartItems array.
    const item = this.findCartItem(user.cart.cartItems, productInfo.productId);
    // case 1 -> Item doesn't exist push it to the array and update meatdata.
    if (!item) {
      user.cart.cartItems.push({
        productId: productInfo.productId,
        count: productInfo.quantity,
      });
      user.cart.cartItemsMeta.cartId = cart._id;
    }
    // case 2 -> Item exists update the item count and metadata.
    else item.count += productInfo.quantity;

    // Now update metadata
    user.cart.cartItemsMeta.cartItemsCount = cart.productsCount;
    user.cart.cartItemsMeta.subTotal = cart.subtotal;
    return user.save();
  }

  async updateCartItem(data) {
    const { user, cart, quantity, type, productId } = data;
    // First find the cart item in user cartItems array.
    const item = this.findCartItem(user.cart.cartItems, productId);
    //  case 1 -> If update operating is ADD_TO_CART then increase the item count.
    if (type === ADD_TO_CART) item.count += +quantity;
    // case 2 -> If update operating is REMOVE_FROM_CART then decrease the item count.
    else item.count -= +quantity;

    // Update metadata.
    user.cart.cartItemsMeta.cartItemsCount = cart.productsCount;
    user.cart.cartItemsMeta.subTotal = cart.subtotal;
    return user.save();
  }

  async removeFromCart(user, cart, productId) {
    //   First find the cart item index in user cartItems array.
    const index = user.cart.cartItems.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    // Remove it and update metadata.
    user.cart.cartItems.splice(index, 1);
    // Update metadata.
    user.cart.cartItemsMeta.cartItemsCount = cart.productsCount;
    user.cart.cartItemsMeta.subTotal = cart.subtotal;
    return user.save();
  }

  async clearCart(user) {
    user.cart.cartItems = [];
    user.cart.cartItemsMeta = {
      ...user.cart.cartItemsMeta,
      cartItemsCount: 0,
      subTotal: 0,
    };
    return user.save();
  }

  findCartItem(cartItems, productId) {
    return cartItems.find(
      (item) => item.productId.toString() === productId.toString()
    );
  }
}

module.exports = new UserService();
