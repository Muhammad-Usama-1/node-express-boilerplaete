const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    lowercase: true,
    unique: true,
    trim: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin", "lead-guide", "guide"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordChangeAt: Date,
  passwordConfirm: {
    type: String,
    validate: {
      //This validator  Only works on CREATE and SAVE not in findbyidandUpdate etc.
      message: "Passwords are not same",
      validator: function (val) {
        // only works on new document
        return val === this.password;
      },
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
});
userSchema.pre("save", async function (next) {
  // Only runs if password is modifiel
  if (!this.isModified("password")) next();

  // Hashing password to avoid brute force attack
  this.password = await bcrypt.hash(this.password, 12);

  // Delete  password confirm field
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre("save", function (next) {
  // Only runs if password is modifiel
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTtimestamp) {
  if (this.passwordChangeAt) {
    const changedTimestamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );
    return JWTtimestamp < changedTimestamp;
  }
  // false mean not changed
  return false;
};
userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
const User = mongoose.model("User", userSchema);
module.exports = User;
