const express=require('express')
const userRoute=express()
const userAuthController=require('../controller/userController/userAuthController')
const multer=require('multer')
const path=require('path')
const config=require('../config/config')
const session = require('express-session')
const auth=require('../middleware/userAuth')
const passport = require('passport');
const userShopController=require('../controller/userController/userShopController')
const cartController=require('../controller/userController/cartController')
const checkoutController=require('../controller/userController/checkoutController')


userRoute.use(session({
    secret:config.sessionSecret,
    saveUninitialized:false,
    resave:false

}))
const bodyParser = require('body-parser');
const { markAsUntransferable } = require('worker_threads')

userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({ extended: true }));


userRoute.use(passport.initialize());
userRoute.use(passport.session());

    userRoute.set('view engine','ejs')
    userRoute.set('views','./views/userViews')
//login
userRoute.get('/',userAuthController.loadHomePage)
userRoute.get('/login',auth.isLogout,userAuthController.loginLoad)
userRoute.post('/login',userAuthController.verifyLogin)
userRoute.get('/logout',auth.isLogin,userAuthController.logout)

//registration
userRoute.get('/registration',  auth.isLogout, userAuthController.registerLoad)
userRoute.post('/registration', auth.isLogout,  userAuthController.registerLoad)

//otp
userRoute.get('/registration/otp', auth.isLogout,  userAuthController.otp)
userRoute.post('/registration/otp/verify', userAuthController.verifyOtp)
userRoute.post('/registration/otp/email',  auth.isLogout, userAuthController.otpMailSender)

userRoute.get('/',userAuthController.loginHome)
// userRoute.get('/logout',userAuthController.logout)

//GOOGLE
// Google authentication route
userRoute.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));
// Google callback route
userRoute.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), userAuthController.googleSuccess);

//shop
userRoute.get('/shop',userShopController.loadShop)
userRoute.get('/shop/productDetails/:productId',userShopController.loadProductDetails)


//profile
userRoute.get('/profile',userAuthController.profileLoad)
userRoute.get('/profile/showAddress',userAuthController.loadshowAddress)
userRoute.post('/profile/showAddress',userAuthController.addAddress)
userRoute.delete('/profile/showAddress/:addressId',userAuthController.deleteAddress)
userRoute.post('/profile/showAddress/edit',userAuthController.editAddress)
userRoute.post('/profile/editProfile',userAuthController.editProfile)
userRoute.post('/profile/changePassword',userAuthController.changePassword)

//cart
userRoute.get('/cart',auth.isLogin,cartController.loadCart)
userRoute.post('/addToCart',cartController.addToCart);
userRoute.post('/update_cart',cartController.updateCart)
userRoute.delete('/removeProduct/:productId',cartController.deleteFromCart)


//checkout
userRoute.get('/cart/checkout',auth.isLogin,checkoutController.checkoutLoad)
userRoute.post('/cart/checkout',checkoutController.checkOutAddAddress)
module.exports = userRoute

    