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
const orderController=require('../controller/userController/orderController')



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
userRoute.get('/forgotPassword',userAuthController.loadForgotPassword)
userRoute.post('/forgotPassword',userAuthController.resetPassword)
userRoute.get('/resetPassword',userAuthController.newPasswordForm)
userRoute.post('/resetPassword',userAuthController.newPassword)
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
userRoute.get('/profile/showOrder',userAuthController.showOrderLoad)
userRoute.get('/profile/showOrder/showOrderDetails/:orderId',userAuthController.showOrderDetails)
userRoute.get('/invoice/:orderId/:itemId',orderController.generateInvoice)
userRoute.post('/profile/showOrder/showOrderDetails/cancel/:orderId/:itemId',userAuthController.cancelOrder)
userRoute.post('/returnOrder',userAuthController.returnOrderRequest)
userRoute.post('/createOrder',userAuthController.createOrder)
userRoute.post('/verifyPayment',userAuthController.verifyPaymentWallet)


//cart
userRoute.get('/cart',cartController.loadCart)
userRoute.post('/addToCart',cartController.addToCart);
userRoute.post('/update_cart',cartController.updateCart)
userRoute.delete('/removeProduct/:productId',cartController.deleteFromCart)


//checkout
userRoute.get('/cart/checkout',auth.isLogin,checkoutController.checkoutLoad)
userRoute.post('/cart/checkout',checkoutController.checkOutAddAddress)
userRoute.post('/cart/createOrder',orderController.createOrder)
userRoute.post('/cart/verifyPayment',orderController.verifyPayment)
userRoute.get('/orderComplete',orderController.orderComplete)
userRoute.post('/applyCoupon',checkoutController.applyCoupon)
userRoute.post('/removeCoupon',checkoutController.removeCoupon)

//wishlist
userRoute.get('/wishlist',userAuthController.getWishlist)
userRoute.post('/wishlist/add',userAuthController.addToWishlist)
userRoute.post('/wishlist/remove',userAuthController.removeFromWishlist)
userRoute.delete('/wishlist/remove/:productId',userAuthController.closeFromWishlist)

//wallet
userRoute.get('/profile/wallet',userAuthController.walletLoad)
userRoute.post('/repay',orderController.repay)


userRoute.use((err,req,res,next)=>{
  console.log('error',err)
  res.status(500).render('500',{error:err.message})
})
module.exports = userRoute

    