const httpErrors = require('http-errors');
const crypto = require('crypto');
const { User, UserValidation } = require('../models/user-model');
const { JoiValidateOptions } = require('../constants');
const hashService = require('./hash-service');

class AuthService {
  async validateUserData(data) {
    return UserValidation.validateAsync(data, JoiValidateOptions);
  }

  async createUser(data) {
    try {
      const hashedPassword = await hashService.hashPassword(data.password);
      const user = new User({ ...data, password: hashedPassword });
      return user.save();
    } catch (error) {
      throw httpErrors.InternalServerError('Something went wrong. Try again.');
    }
  }

  generateOtp() {
    const otp = crypto.randomInt(1000, 9999);
    return otp;
  }

  validateOTP(info) {
    const [hashedOTP, expires] = info.hash.split('.');
    if (expires < Date.now()) throw httpErrors.BadRequest('OTP has expired.');

    const { email, otp } = info;
    const data = `${email}.${otp}.${expires}`;
    const isValid = hashService.verifyOTP(hashedOTP, data);

    if (!isValid) throw httpErrors.BadRequest("OTP doesn't match.");
  }

  async findUser(filter) {
    return User.findOne(filter).exec();
  }
}

module.exports = new AuthService();
