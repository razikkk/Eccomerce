const Address=require('../../models/addressModel')
const Cart=require('../../models/cartModel')
const Coupon = require('../../models/couponModel')
const User = require('../../models/userModel')
const { findById } = require('../../models/userModel')

const checkoutLoad=async(req,res)=>{
    try {
        const user=req.session.userId
        const address=await Address.find({userId:user})
        const cartDatas=await Cart.findOne({userId:user}).populate("products.productId");
        const couponId = await Coupon.find()
        let insufficientStock = false;
        let updatedProducts = [];

        for (const cartProduct of cartDatas.products) {
            const product = cartProduct.productId;
            const requestedQuantity = cartProduct.quantity;

            if (requestedQuantity > product.stock) {
                insufficientStock = true;
                cartProduct.quantity = product.stock;
                await cartDatas.save();

                updatedProducts.push({
                    product: product.name,
                    requestedQuantity,
                    availableStock: product.stock
                });
            }
        }

        res.render('checkout',{user:user,isLogin: req.session.userId ? true : false,address:address,cartDatas:cartDatas,coupons:couponId,insufficientStock,updatedProducts,cartCount:req.session.userId ? req.session.cartCount : 0 })
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
}
const checkOutAddAddress=async(req,res)=>{
    try {
        const userId=req.session.userId
        const {name,street,city,state,zipcode,mobile}=req.body;
        
        const newAddress=new Address({
            userId:userId,
            name:name,
            street:street,
            city:city,
            state:state,
            zipcode:zipcode,
            mobile:mobile
        })
        await newAddress.save()
        // res.redirect('/profile/showAddress')
        res.status(201).json({ success: true, message: 'Address added successfully', addresses: newAddress });
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
  }

  const applyCoupon = async(req,res)=>{
    try {
        const {couponCode,subTotal} = req.body
        const coupon = await Coupon.findOne({couponCode:couponCode})
        const userId = req.session.userId
        const cart = await Cart.findOne({userId:userId})
        const user = await User.findById(userId)
        if(!coupon){
            return res.json({success:false,message:"Invalid Coupon Code"})
        }
        if(coupon.expiryDate<new Date()){
            return res.json({success:false,message:"coupon had expired"})
        }

        if (subTotal < coupon.minAmount) {
            return res.json({ success: false, message: `Minimum amount of ₹${coupon.minAmount} is required to apply this coupon` });
        }

        if(coupon.usedBy.includes(userId)){
            return res.json({success:false,message:` ${user.name} you have used this coupon already`})
        }
        coupon.usedBy.push(userId)
        await coupon.save()

        res.status(200).json({success:true,percentage:coupon.percentage,cart})
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
  }
  const removeCoupon = async(req,res)=>{
    try {
        const userId = req.session.userId
        if(!userId){
            return res.status(404).json({success:false,message:"user not found"})
        }
        const cart = await Cart.findOne({userId:userId})
        if(!cart){
            return res.status(404).json({success:false,message:"cart not found"})
        }
        cart.coupon = null;
        cart.save()
        res.status(200).json({success:true,message:"coupon removed successfully"})
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
  }
module.exports={
    checkoutLoad,
    checkOutAddAddress,
    applyCoupon,
    removeCoupon
}