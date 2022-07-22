const httpErrors = require('http-errors');
const tokenService = require('../services/token-service');
const userService = require('../services/user-service');

async function authMiddleware(req, res, next) {
  try {
    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken)
      return next(httpErrors.Unauthorized('Login to access this route.'));

    const { id } = await tokenService.verifyAccessToken(accessToken);
    const user = await userService.findUser({ _id: id });
    if (!user) {
      tokenService.clearCookie(res, 'accessToken');
      tokenService.clearCookie(res, 'refreshToken');
      if (refreshToken) await tokenService.deleteRefreshToken(refreshToken);
      return next(httpErrors.Unauthorized('Session expired. Login again'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name))
      error.message = 'Session expired. Login again.';
    next(error);
  }
}

module.exports = authMiddleware;
