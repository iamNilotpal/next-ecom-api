const httpErrors = require('http-errors');
const UserDto = require('../dtos/user-dto');
const hashService = require('../services/hash-service');
const tokenService = require('../services/token-service');
const userService = require('../services/user-service');

class AuthController {
  async register(req, res, next) {
    try {
      const { firstName, lastName, email, phone, password, address } = req.body;

      if (!firstName || !lastName || !email || !password || !phone || !address)
        return next(httpErrors.BadRequest('All fields are required.'));

      const data = await userService.validateUserData(req.body);
      const exist = await userService.findUser({ email: data.email });
      if (exist) return next(httpErrors.Conflict('User already exist.'));

      const user = await userService.createUser(data);
      const accessToken = await tokenService.accessToken({ id: user._id });
      const refreshToken = await tokenService.refreshToken({ id: user._id });

      tokenService.setAccessToken(res, accessToken);
      tokenService.setRefreshToken(res, refreshToken);

      return res.status(201).json({
        ok: true,
        user: new UserDto(user),
      });
    } catch (error) {
      if (error.isJoi) error.status = 400;
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return next(httpErrors.BadRequest('All fields are required.'));

      const user = await userService.findUser({ email });
      if (!user)
        return next(httpErrors.Unauthorized('Invalid email or password.'));

      const isValidPassword = await hashService.comparePassword(
        password,
        user.password
      );

      if (!isValidPassword)
        return next(httpErrors.Unauthorized('Invalid email or password.'));

      const accessToken = await tokenService.accessToken({ id: user._id });
      const refreshToken = await tokenService.refreshToken({ id: user._id });

      tokenService.setAccessToken(res, accessToken);
      tokenService.setRefreshToken(res, refreshToken);

      return res.status(200).json({
        ok: true,
        user: new UserDto(user),
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.cookies;

      tokenService.clearCookie(res, 'accessToken');
      tokenService.clearCookie(res, 'refreshToken');

      await tokenService.deleteRefreshToken(refreshToken);
      return res.status(200).json({ ok: true, user: null });
    } catch (error) {
      tokenService.clearCookie(res, 'accessToken');
      tokenService.clearCookie(res, 'refreshToken');
      return res.status(200).json({
        ok: true,
        user: null,
      });
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken: token } = req.cookies;
      if (!token) return next(httpErrors.BadRequest('Token must be provided.'));

      const data = await tokenService.verifyRefreshToken(token);
      if (!data) return next(httpErrors.Unauthorized('Token expired.'));

      const tokenData = await tokenService.findRefreshToken(token, data.id);
      if (!tokenData) return next(httpErrors.Unauthorized('Token expired.'));

      const user = await userService.findUser({ _id: tokenData.userId });
      if (!user) return next(httpErrors.NotFound("User doesn't exist."));

      await tokenData.remove();
      const accessToken = await tokenService.accessToken({ id: user._id });
      const refreshToken = await tokenService.refreshToken({ id: user._id });

      tokenService.setAccessToken(res, accessToken);
      tokenService.setRefreshToken(res, refreshToken);

      return res.status(200).json({
        ok: true,
        user: new UserDto(user),
      });
    } catch (error) {
      if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name))
        error.message = 'Session expired. Login again.';
      next(error);
    }
  }
}

module.exports = new AuthController();
