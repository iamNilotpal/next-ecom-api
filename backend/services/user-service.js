const { User, UserValidation } = require('../models/user-model');
const { JoiValidateOptions, ADD_TO_CART } = require('../utils');
const hashService = require('./hash-service');

class UserServices {
  async validateUserData(data) {
    return UserValidation.validateAsync(data, JoiValidateOptions);
  }

  async createUser(data) {
    try {
      const hashedPassword = await hashService.hashPassword(data.password);
      const user = new User({ ...data, password: hashedPassword });
      return user.save();
    } catch (error) {
      throw error;
    }
  }

  async findUser(filter) {
    return User.findOne(filter).exec();
  }

  async addToCart(user, cart, quantity) {
    const item = this.findCartItem(user, cart);
    if (!item) user.cart.cartItems.push({ id: cart._id, count: quantity });
    else item.count += quantity;
    user.cart.cartItemsMeta.cartItemsCount = cart.productsCount;
    user.cart.cartItemsMeta.subTotal = cart.subtotal;
    return user.save();
  }

  async updateCartItem(data) {
    const { user, cart, quantity, type } = data;
    const item = this.findCartItem(user, cart);

    if (type === ADD_TO_CART) item.count += +quantity;
    else item.count -= +quantity;

    user.cart.cartItemsMeta.cartItemsCount = cart.productsCount;
    user.cart.cartItemsMeta.subTotal = cart.subtotal;
    return user.save();
  }

  async updateCart(user, cart) {
    const item = this.findCartItem(user, cart);
    item.count = cart.productsCount;
    user.cart.cartItemsMeta.cartItemsCount = cart.productsCount;
    user.cart.cartItemsMeta.subTotal = cart.subtotal;
    return user.save();
  }

  findCartItem(user, cart) {
    return user.cart.cartItems.find(
      (item) => item.id.toString() === cart._id.toString()
    );
  }
}

module.exports = new UserServices();
