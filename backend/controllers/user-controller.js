const httpErrors = require('http-errors');
const userService = require('../services/user-service');
const tokenService = require('../services/token-service');
const UserDto = require('../dtos/user-dto');

class UserController {
  async updatePersonalInfo(req, res, next) {
    try {
      const personalInfo = await userService.validatePersonalInfo(req.body);
      if (Object.entries(personalInfo).length === 0)
        return next(httpErrors.BadRequest('Atleast one field is required.'));

      const user = await userService.updatePersonalInfo(req.user, personalInfo);
      return res.status(200).json({
        success: true,
        user: new UserDto(user),
      });
    } catch (error) {
      if (error.isJoi) {
        error.status = 400;
        return next(error);
      }
      next(httpErrors.BadRequest(error.message));
    }
  }

  async changePassword(req, res, next) {
    try {
      const user = await userService.updatePassword(req.user, req.body);
      await tokenService.deleteRefreshToken(req.cookies.refreshToken);
      tokenService.clearCookies(res);

      const accessToken = await tokenService.accessToken({ id: user._id });
      const refreshToken = await tokenService.refreshToken({ id: user._id });
      tokenService.setAccessToken(res, accessToken);
      tokenService.setRefreshToken(res, refreshToken);

      return res.status(200).json({
        success: true,
        user: new UserDto(user),
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      await userService.deleteAccount(req.user);
      await tokenService.deleteRefreshToken(req.cookies.refreshToken);
      tokenService.clearCookies(res);
      return res.status(200).json({
        success: true,
        user: null,
      });
    } catch (error) {
      return next(httpErrors.InternalServerError('Something went wrong.'));
    }
  }
}

module.exports = new UserController();
