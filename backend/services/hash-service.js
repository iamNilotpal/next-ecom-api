const crypto = require('crypto');
const bcrypt = require('bcrypt');

class HashService {
  async hashPassword(password) {
    return bcrypt.hash(password, 13);
  }

  hashOTP(data) {
    return crypto
      .createHmac('sha256', process.env.SECRET_HASH_OTP)
      .update(data)
      .digest()
      .toString('hex');
  }

  verifyOTP(hashedOTP, data) {
    const computedHash = this.hashOTP(data);
    return hashedOTP === computedHash;
  }

  async checkPassword(password, encryptedPassword) {
    return bcrypt.compare(password, encryptedPassword);
  }
}

module.exports = new HashService();
