const bcrypt = require('bcrypt');

class HashService {
  async hashPassword(password) {
    return bcrypt.hash(password, 13);
  }

  async checkPassword(password, encryptedPassword) {
    return bcrypt.compare(password, encryptedPassword);
  }
}

module.exports = new HashService();
