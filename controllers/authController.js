const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");
const Email = require("../utils/email");

const signToken = (id, name) =>
  jwt.sign({ id, name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  // console.log("SECURE--> ", req.secure);
  user.password = undefined;
  const token = signToken(user._id, user.name);
  res.status(statusCode).json({
    status: "Success",
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const url = ` ${req.protocol}://${req.get("host")}/me`;

  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Please provide email and password", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password", 400));
  createSendToken(user, 200, req, res);
});
exports.logout = (req, res) => {
  res.status(200).json({
    status: "Success",
  });
};
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you do not have permission for this request", 403)
      );
    }
    next();
  };
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on posted email
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return next(new AppError(" There is no user with your given email", 404));
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken} `;
    await new Email(user, resetURL).sendPasswordReset();
    console.log("Failning after sending email");
    res.status(200).json({
      status: "Success",
      message: "Token sent to email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was ana error sending an email", 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 Get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2 if token has not expired and there is a user, set the new pasword
  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  // 3 Update changedpasswordat propery for  the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 4 log the user in, send the JWT
  createSendToken(user, 200, req, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  if (
    !req.body.passwordCurrent ||
    !req.body.passwordConfirm ||
    !req.body.password
  ) {
    return next(
      new AppError("Please provide current and new password correctly ", 401)
    );
  }
  // 2) Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong ", 401));
  }
  // 3) If so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log the user in send JWT
  createSendToken(user, 200, req, res);
});
// Only for rendered pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 2) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // GRANT ACCESS TO PROTECTED ROUTE
      res.locals.user = currentUser;
      req.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
exports.sendIsLoggedIn = (req, res, next) => {
  const isLoggedIn = !!req.user;
  const user = req.user ? req.user : null;
  res.status(200).json({
    isLoggedIn,
    user,
  });
};
