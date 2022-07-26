const httpErrors = require('http-errors');
const userService = require('../services/user-service');
const tokenService = require('../services/token-service');
const UserDto = require('../dtos/user-dto');
const Joi = require('joi');
const { JoiValidateOptions } = require('../utils');
const authService = require('../services/auth-service');
const hashService = require('../services/hash-service');

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
      await tokenService.deleteRefreshToken({
        token: req.cookies.refreshToken,
      });
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

  async sendPasswordResetMail(req, res, next) {
    try {
      const email = await Joi.string()
        .trim()
        .email()
        .required()
        .label('Email')
        .validateAsync(req.body.email, JoiValidateOptions);

      const user = await authService.findUser({ email });
      if (!user)
        return next(httpErrors.NotFound("User doesn't exist with this email."));

      const otp = authService.generateOtp();
      const ttl = 1000 * 60 * 10; /* 10 Minutes ---- TTL -> Time To Live*/
      const expires = Date.now() + ttl; /* Will expire after 10 minute */
      const data = `${email}.${otp}.${expires}`; /* Will match with the hash provided by the user */

      const hash = hashService.hashOTP(data);
      tokenService.setHashToCookie(res, {
        hash: `${hash}.${expires}`,
        expires,
      });

      const token = await tokenService.accessToken({
        isVerified: false,
        email,
      });
      tokenService.setOTPVerificationToCoookie(res, token);
      // TODO REMOVE COMMENT
      // await userService.sendPasswordResetMail(otp, email);

      return res.status(200).json({
        success: true,
        message: 'Enter the otp sent to your email.',
        otp,
      });
    } catch (error) {
      if (error.isJoi) error.status = 422;
      return next(error);
    }
  }

  async verifyOTP(req, res, next) {
    try {
      const { otp } = req.body;
      const { hash, verified_sid } = req.cookies;
      if (!hash || !verified_sid)
        return next(httpErrors.BadRequest('Maybe next time );.'));

      const { email } = await tokenService.verifyOtpToken(verified_sid);
      const user = await authService.findUser({ email });
      if (!user) return next(httpErrors.NotFound("User doesn't exist."));

      authService.validateOTP({ hash, email, otp });
      const token = await tokenService.accessToken({ isVerified: true, email });
      tokenService.setOTPVerificationToCoookie(res, token);
      res.clearCookie('hash');

      return res.status(200).json({
        success: true,
        message: 'OTP verified.',
      });
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { password } = req.body;
      const { verified_sid } = req.cookies;

      if (!verified_sid) return next(httpErrors.BadRequest('Maybe later );.'));
      userService.checkNewPassword(password);

      const { email, isVerified } = await tokenService.verifyOtpToken(
        verified_sid
      );
      const user = await authService.findUser({ email });
      if (!user)
        return next(httpErrors.NotFound("User doesn't exist with this email."));

      if (!isVerified)
        return next(httpErrors.Unauthorized('OTP is not verified.'));

      tokenService.clearCookies(res);
      res.clearCookie('verified_sid');
      await tokenService.deleteRefreshToken({ userId: user._id });

      const hashedPassword = await hashService.hashPassword(password);
      user.password = hashedPassword;
      await user.save();

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
      await tokenService.deleteRefreshToken({
        token: req.cookies.refreshToken,
      });
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
