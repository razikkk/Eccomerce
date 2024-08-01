const Address=require('../../models/addressModel')
const Cart=require('../../models/cartModel')
const Coupon = require('../../models/couponModel')










const checkoutLoad=async(req,res)=>{
    try {
        const user=req.session.userId
        const address=await Address.find({userId:user})
        const cartDatas=await Cart.findOne({userId:user}).populate("products.productId");
        const couponId = await Coupon.find()

        res.render('checkout',{user:user,isLogin: req.session.userId ? true : false,address:address,cartDatas:cartDatas,coupons:couponId})
    } catch (error) {
        console.log(error.message)
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
        console.log(newAddress,'dhsidsa')
        // res.redirect('/profile/showAddress')
        res.status(201).json({ success: true, message: 'Address added successfully', addresses: newAddress });
    } catch (error) {
        console.log(error.message)
    }
  }

  const applyCoupon = async(req,res)=>{
    try {
        const {couponCode,subTotal} = req.body
        console.log('hhdd',couponCode)
        const coupon = await Coupon.findOne({couponCode:couponCode})
        console.log("j3",coupon);
        if(!coupon){
            return res.json({success:false,message:"Invalid Coupon Code"})
        }
        console.log("h4");
        if(coupon.expiryDate<new Date()){
            return res.json({success:false,message:"coupon had expired"})
        }
        console.log("h3");
        
        res.status(200).json({success:true,percentage:coupon.percentage})
    } catch (error) {
        
    }
  }
module.exports={
    checkoutLoad,
    checkOutAddAddress,
    applyCoupon
}