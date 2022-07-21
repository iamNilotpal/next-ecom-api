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
    return User.findOne(filter);
  }
}

module.exports = new UserServices();
