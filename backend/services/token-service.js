const util = require('util');
const JWT = require('jsonwebtoken');
const RefreshToken = require('../models/token-model');

const signToken = util.promisify(JWT.sign);
const verifyToken = util.promisify(JWT.verify);

const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
const JWT_REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;

class TokenService {
  async accessToken(payload) {
    return signToken(payload, JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: '1h',
      issuer: process.env.BASE_URL,
      audience: String(payload.id),
    });
  }

  async refreshToken(payload) {
    try {
      const refreshToken = await signToken(payload, JWT_REFRESH_TOKEN_SECRET, {
        expiresIn: '1y',
        issuer: process.env.BASE_URL,
        audience: String(payload.id),
      });
      await this.storeRefreshToken(refreshToken, payload.id);
      return refreshToken;
    } catch (error) {
      throw error;
    }
  }

  async storeRefreshToken(token, userId) {
    return RefreshToken.create({ token, userId });
  }

  setTokenCookie(res, key, data) {
    res.cookie(key, data.token, {
      maxAge: data.age,
      httpOnly: true,
      sameSite: 'none',
      path: '/',
      secure: true,
    });
  }

  setAccessToken(res, token) {
    this.setTokenCookie(res, 'accessToken', {
      token,
      age: 1000 * 60 * 60 * 1,
    });
  }

  setRefreshToken(res, token) {
    this.setTokenCookie(res, 'refreshToken', {
      token,
      age: 1000 * 60 * 60 * 24 * 365,
    });
  }

  clearCookies(res) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  async verifyAccessToken(token) {
    return verifyToken(token, JWT_ACCESS_TOKEN_SECRET);
  }

  async verifyRefreshToken(token) {
    return verifyToken(token, JWT_REFRESH_TOKEN_SECRET);
  }

  async findRefreshToken(token, userId) {
    return RefreshToken.findOne({ token, userId }).exec();
  }

  async deleteRefreshToken(token) {
    return RefreshToken.deleteOne({ token }).exec();
  }
}

module.exports = new TokenService();
