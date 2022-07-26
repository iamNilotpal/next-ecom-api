const httpErrors = require('http-errors');
const tokenService = require('../services/token-service');
const authService = require('../services/auth-service');

async function authMiddleware(req, res, next) {
  const { accessToken, refreshToken } = req.cookies;

  /* Check if both accessToken and refreshToken exists in cookie */
  /* If don't then return Unauthorized error. Because in normal case the tokens will be there 
    if no one is fiddling with the system, if not then someone is doing something suspicious activity.
  */
  if (!accessToken && !refreshToken)
    return next(httpErrors.Unauthorized('Login to access this route.'));

  try {
    /* Now verify the access token, If it is valid then get the id and find the corresponding user.
      case 1 -> User doesn't exist then return Uantuhorized for Not Found error.
      case 2 -> User exist so attach the user in the req object and call next().
      case 3 -> Invaid or expired token will lead to catch block.
    */
    const { id } = await tokenService.verifyAccessToken(accessToken);
    const user = await authService.findUser({ _id: id });
    if (!user) {
      tokenService.clearCookies(res);
      if (refreshToken)
        await tokenService.deleteRefreshToken({ token: refreshToken });
      return next(httpErrors.Unauthorized('Session expired. Login again'));
    }

    req.user = user;
    next();
  } catch (error) {
    /* If the error is something else other than TokenExpiredError return Unauthotized error. 
      Which means the client has modified the tokens and also clear the cookies.
    */
    if (error.name === 'JsonWebTokenError') {
      tokenService.clearCookies(res);
      return next(httpErrors.Unauthorized('Session expired. Login again.'));
    }

    try {
      /* Now verify the refresh token, If it is valid then get the id and find the corresponding user.
      case 1 -> User doesn't exist then return Uantuhorized for Not Found error.
      case 2 -> User exist so attach the user in the req object and call next().
      case 3 -> Invaid or expired token will lead to catch block.
    */
      const { refreshToken: token } = req.cookies;
      const userData = await tokenService.verifyRefreshToken(token);
      const user = await authService.findUser({ _id: userData.id });

      if (!user) {
        tokenService.clearCookies(res);
        await tokenService.deleteRefreshToken({ token });
        return next(httpErrors.Unauthorized('Session expired. Login again'));
      }

      const accessToken = await tokenService.accessToken({ id: user._id });
      const refreshToken = await tokenService.refreshToken({ id: user._id });

      tokenService.setAccessToken(res, accessToken);
      tokenService.setRefreshToken(res, refreshToken);
      req.user = user;
      next();
    } catch (error) {
      error.message = 'Session expired. Login again.';
      error.status = 401;
      return next(error);
    }
  }
}

module.exports = authMiddleware;
