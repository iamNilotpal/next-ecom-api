const { User, UserValidation } = require('../models/user-model');
const { JoiValidateOptions } = require('../utils');
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
    const item = user.cart.cartItems.find(
      (item) => item.id.toString() === cart._id.toString()
    );

    if (!item) user.cart.cartItems.push({ id: cart._id, count: quantity });
    else item.count += quantity;
    user.cart.cartItemsMeta.cartItemsCount = cart.productsCount;
    user.cart.cartItemsMeta.subTotal = cart.subtotal;
    return user.save();
  }
}

module.exports = new UserServices();
