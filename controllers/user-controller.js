const httpErrors = require('http-errors');
const userService = require('../services/user-service');
const tokenService = require('../services/token-service');
const UserDto = require('../dtos/user-dto');
const Joi = require('joi');
const { JoiValidateOptions } = require('../constants');
const authService = require('../services/auth-service');
const hashService = require('../services/hash-service');

class UserController {
  async updatePersonalInfo(req, res, next) {
    try {
      // * Validate req.body if OK then update user information.
      await userService.validatePersonalInfo(req.body);
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
      // Validate passwords
      const user = await userService.updatePassword(req.user, req.body);
      // Remove the refresh token corresponding to the user
      await tokenService.deleteRefreshToken({
        token: req.cookies.refreshToken,
      });
      // Clear cookies
      tokenService.clearCookies(res);

      // * Generate new tokens and attack to the cookie.
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
      // *First validate email and check against user collection.
      // If user doesn't exist send 404 error
      const email = await Joi.string()
        .trim()
        .email()
        .required()
        .label('Email')
        .validateAsync(req.body.email, JoiValidateOptions);

      const user = await authService.findUser({ email });
      if (!user)
        return next(httpErrors.NotFound("User doesn't exist with this email."));

      // Generate random OTP -> 4digits
      // ? Add 10 mins to the current time that will be the expiry time.
      // ? Construct hash using the data.
      const otp = authService.generateOtp();
      const ttl = 1000 * 60 * 10; // ? 10 Minutes ---- TTL -> Time To Live.
      const expires = Date.now() + ttl; // ? Will expire after 10 minute.
      const data = `${email}.${otp}.${expires}`; // ? Will match with the hash provided by the user.

      const hash = hashService.hashOTP(data);
      // Set the hash to cookie which will be check against verifyOTP process.
      tokenService.setHashToCookie(res, {
        hash: `${hash}.${expires}`,
        expires,
      });

      // ? Some additional cookie to prove identity and verification.
      // ? Access Token that will be verified in verify OTP process.
      // ? Set isVerified property to false which means user hasn't verified the otp.
      // ? Will be set to true when verification is done.
      const token = await tokenService.accessToken({
        isVerified: false,
        email,
      });
      tokenService.setOTPVerificationToCookie(res, token);
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

      // Check otp, hash, verified_sid exist if not send an error message.
      if (!otp) return next(httpErrors.BadRequest('OTP must be provided.'));
      if (!hash || !verified_sid)
        return next(httpErrors.BadRequest('Maybe next time );.'));

      // * First verify the verified_sid token. If OK then we will get the user email.
      // * Now check user exist with that email not not send error message.
      const { email } = await tokenService.verifyOtpToken(verified_sid);
      const user = await authService.findUser({ email });
      if (!user) return next(httpErrors.NotFound("User doesn't exist."));

      // Now validate the otp.
      authService.validateOTP({ hash, email, otp });
      // Now generate verified_sid token and set isVerified property to true.
      // Which will be check while resetting the password in next step.
      const token = await tokenService.accessToken({ isVerified: true, email });
      tokenService.setOTPVerificationToCookie(res, token);
      // Clear the otp hash from cookie
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

      //  check verified_sid and password is provided.
      if (!verified_sid) return next(httpErrors.BadRequest('Maybe later );.'));
      userService.checkNewPassword(password);

      // Verify verified_sid and get the email and isVerified property,
      const { email, isVerified } = await tokenService.verifyOtpToken(
        verified_sid
      );

      // Now check the email against user collection if any user exist with that email.
      const user = await authService.findUser({ email });
      if (!user)
        return next(httpErrors.NotFound("User doesn't exist with this email."));
      // Check if isVerified property is True or False.
      // If False then the user hasn't verified the otp yet.
      // So, send error message to verify the otp.
      if (!isVerified)
        return next(httpErrors.Unauthorized('OTP is not verified.'));

      /* If verification is done then clear all cookies and the refresh token
        for that user.
      */
      tokenService.clearCookies(res);
      res.clearCookie('verified_sid');
      await tokenService.deleteRefreshToken({ userId: user._id });

      // Now hash the new password and update with current user password.
      const hashed̥Password = await hashService.hashPassword(password);
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
