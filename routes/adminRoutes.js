const express=require('express')
const adminRoute=express()
const adminAuthController=require('../controller/adminController/adminAuthcontroller')
const auth=require('../middleware/adminAuth')
const adminUserController=require('../controller/adminController/adminUserController')
const productController=require('../controller/adminController/productController')
const orderController=require('../controller/adminController/adminOrderController')
const couponController=require('../controller/adminController/couponController')
const config=require('../config/config')
const session=require('express-session')
const multer = require('multer');
const path = require('path');
const { cannotHaveAUsernamePasswordPort } = require('whatwg-url')
const offerController = require('../controller/adminController/offerController')

// Configure multer storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../public/user/images'));
    },
    filename: function(req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage });



adminRoute.use(session({
    secret:config.sessionSecret,
    saveUninitialized:false,
    resave:false

}))


adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/adminViews')

//login
adminRoute.get('/login',auth.isLogout,  adminAuthController.loadAdminLogin)
adminRoute.post('/login',adminAuthController.verifyLogin)
adminRoute.get('/dashboard',auth.isLogin,adminAuthController.dashboardLoad)
adminRoute.get('/dashboard/getOrderStatus',adminAuthController.getOrderStats)
adminRoute.get('/logout',adminAuthController.logout)

//user managment
adminRoute.get('/users',auth.isLogin,adminUserController.loadUser)
adminRoute.put('/blockUser',auth.isLogin,adminUserController.block)
adminRoute.put('/unblockUser',adminUserController.unblock)

//category managment
adminRoute.get('/category',auth.isLogin,adminAuthController.categoryLoad)
adminRoute.get('/category/addCategory',auth.isLogin,adminAuthController.loadAddCategory)
adminRoute.post('/category/addCategory',auth.isLogin,adminAuthController.addCategory)
//adminRoute.get('/category/editCategory',adminAuthController.loadEditCategory)
adminRoute.post('/category/edit',auth.isLogin,adminAuthController.editCategory)
adminRoute.delete('/category/deleteCategory',auth.isLogin,adminAuthController.deleteCatergory)
adminRoute.get('/category/deletedCategory',auth.isLogin,adminAuthController.loadDeletedCategory)
adminRoute.get('/category/restoreCategory',auth.isLogin,adminAuthController.restoredCategory)

//products managment
adminRoute.get('/products',auth.isLogin,productController.productsLoad)
adminRoute.get('/products/addProduct',auth.isLogin,productController.loadAddproduct)
adminRoute.post('/product/addProduct',auth.isLogin,upload.any(),productController.addProduct)
adminRoute.get('/product/productDetails',auth.isLogin,productController.checkAlready)
adminRoute.get('/product/editProduct',auth.isLogin,productController.loadEditProduct)
adminRoute.delete('/product/deleteProduct',auth.isLogin,productController.loadDeleteProduct)
adminRoute.get('/product/deletedProduct',auth.isLogin,productController.loadDeletedProduct)
adminRoute.get('/product/restoreProduct',auth.isLogin,productController.restoreProduct)
adminRoute.post('/product/editProduct',auth.isLogin,upload.any(),productController.editProduct)

//order managment
adminRoute.get('/orders',orderController.orderLoad)
adminRoute.get('/orders/orderDetails/:orderId',orderController.OrderDetailsLoad)
adminRoute.post('/orders/orderDetails/updateStatus',orderController.updateOrderStatus)
adminRoute.patch('/orders/:orderId/items/:itemId/status', orderController.updateOrderItemStatus);


//coupon
adminRoute.get('/coupon',auth.isLogin,couponController.couponLoad)
adminRoute.post('/coupon/add',auth.isLogin,couponController.addCoupon)
adminRoute.delete('/coupon/:id',couponController.deleteCoupon)
adminRoute.put('/coupon/edit/:id',couponController.editCoupon)


//sales report
adminRoute.get('/salesReport',auth.isLogin,adminAuthController.salesReportLoad)
adminRoute.get('/filterSalesInterval',auth.isLogin,adminAuthController.filterSalesInterval)
adminRoute.get('/filterSalesReport',auth.isLogin,adminAuthController.filterSalesReport)

//offer
adminRoute.get('/categoryOffer',auth.isLogin,offerController.categoryOfferLoad)
adminRoute.post('/categoryOffer/addOffer',offerController.addCategoryOffer)
adminRoute.post('/categoryOffer/editOffer',offerController.editCategoryOffer)
adminRoute.delete('/categoryOffer/delete',offerController.deleteCategoryOffer)
adminRoute.get('/productOffer',auth.isLogin,offerController.productOfferLoad)
adminRoute.post('/productOffer/add',offerController.addProductOffer)
adminRoute.post('/productOffer/edit',offerController.editProductOffer)
adminRoute.delete('/productOffer/delete',offerController.deleteProductOffer)
module.exports=adminRoute