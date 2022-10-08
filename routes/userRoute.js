const express = require('express');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  logout,
  isLoggedIn,
  sendIsLoggedIn,
} = require('../controllers/authController');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');
const { restrictTo } = require('../controllers/authController');

const userRoute = express.Router();

userRoute.post('/sign-up', signup);
userRoute.post('/login', login);
userRoute.get('/logout', logout);
// For API (client side rendering)
userRoute.get('/isLoggedIn', isLoggedIn, sendIsLoggedIn);
userRoute.post('/forgotPassword', forgotPassword);
userRoute.patch('/resetPassword/:token', resetPassword);

userRoute.use(protect);
userRoute.get('/me', getMe, getUser);
userRoute.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
userRoute.delete('/deleteMe', deleteMe);
userRoute.patch('/updateMyPassword', updatePassword);

userRoute.use(restrictTo('admin'));

userRoute.route('/').get(getAllUsers).post(createUser);
userRoute.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);
module.exports = userRoute;
