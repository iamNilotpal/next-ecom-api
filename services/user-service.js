const httpErrors = require('http-errors');
const sendGrid = require('@sendgrid/mail');
const {
  PersonalInfoValidation,
  PasswordValidationSchema,
} = require('../models/user-model');
const { ADD_TO_CART, JoiValidateOptions } = require('../constants');
const hashService = require('./hash-service');
const cartService = require('./cart-service');

class UserService {
  async updatePersonalInfo(user, personalInfo) {
    // Update information only if the user hash provided.
    // If not then set it to pervious values.
    user.firstName = personalInfo.firstName || user.firstName;
    user.lastName = personalInfo.lastName || user.lastName;
    user.email = personalInfo.email || user.email;
    user.phone = personalInfo.phone || user.phone;
    user.address.pincode = personalInfo.address.pincode || user.address.pincode;
    user.address.state = personalInfo.address.state || user.address.state;
    user.address.town = personalInfo.address.town || user.address.town;
    return user.save();
  }

  async validatePersonalInfo(info) {
    const personalInfo = await PersonalInfoValidation.validateAsync(
      info,
      JoiValidateOptions
    );
    if (Object.entries(personalInfo).length === 0)
      throw httpErrors.BadRequest('At least one field is required.');
  }

  async addToCart(user, cart, productInfo) {
    //  First find the cart item in user cartItems array.
    const item = this.findCartItem(user.cart.cartItems, productInfo.productId);
    // case 1 -> Item doesn't exist push it to the array and update metadata.
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
    user.cart = {};
    return user.save();
  }

  async updatePassword(user, data) {
    try {
      const { oldPassword, newPassword } =
        await PasswordValidationSchema.validateAsync(data, JoiValidateOptions);

      if (oldPassword.toLowerCase() === newPassword.toLowerCase())
        throw httpErrors.BadRequest('Passwords must be different.');

      const isValid = await hashService.checkPassword(
        oldPassword,
        user.password
      );
      if (!isValid) throw httpErrors.BadRequest("Password doesn't match.");

      const hashedPassword = await hashService.hashPassword(newPassword);
      user.password = hashedPassword;
      return user.save();
    } catch (error) {
      if (error.isJoi) error.status = 422;
      throw error;
    }
  }

  async deleteAccount(user) {
    await cartService.clearCart(user._id);
    return user.remove();
  }

  async sendPasswordResetMail(otp, email) {
    try {
      sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: email,
        from: process.env.SENDGRID_EMAIL,
        subject: 'Password Reset Email',
        text: `Your OTP for Next E-Commerce is ${otp}. OTP expires in 10 minutes.`,
        html: `<strong>Your OTP for Next E-Commerce is ${otp}. OTP expires in 10 minutes.</strong>`,
      };
      await sendGrid.send(msg);
    } catch (error) {
      throw httpErrors.InternalServerError('Error sending email.');
    }
  }

  findCartItem(cartItems, productId) {
    return cartItems.find(
      (item) => item.productId.toString() === productId.toString()
    );
  }

  checkNewPassword(password) {
    if (!password)
      throw httpErrors.UnprocessableEntity('Password must be provided.');

    if (password.length < 5)
      throw httpErrors.UnprocessableEntity(
        'Password must be at least 5 characters long.'
      );
  }
}

module.exports = new UserService();
