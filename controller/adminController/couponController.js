const Coupon = require('../../models/couponModel')

const couponLoad = async(req,res)=>{
    try {
        let coupons = await Coupon.find()
        res.render('coupon',{coupon:coupons})
    } catch (error) {
        console.log(error.message)
    }
}
const addCoupon = async(req,res)=>{
    try {
        const {couponCode,percentage,minAmount,maxRedeemAmount,expiryDate} = req.body;
        let coupon = await Coupon.findOne({couponCode:couponCode})
        if(!coupon){
         coupon =await  new Coupon({
            couponCode,
            percentage,
            minAmount,
            maxRedeemAmount,
            expiryDate
        })
    }
        await coupon.save()
        res.status(200).json({success:true,message:"coupon created"})
    } catch (error) {
        console.log(error.message)
    }
}

const deleteCoupon = async(req,res)=>{
    try {
        const couponId = req.params.id

        await Coupon.findByIdAndDelete(couponId)
        return res.status(200).json({success:true,message:"deleted successfully"})
    } catch (error) {
        console.log(error.message)
    }
}
const editCoupon = async(req,res)=>{
    try {
        console.log('hyy')
        const couponId = req.params.id
        const {couponCode,percentage,minAmount,maxRedeemAmount,expiryDate} = req.body
        console.log(couponId)
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            {couponCode,percentage,minAmount,maxRedeemAmount,expiryDate},
            {new : true}
        )
        if(!updatedCoupon){
            return res.status(404).json({success:false,message:"coupon not found"})
        }
        
        res.status(200).json({success:true,message:"coupon updated successfully",coupon:updatedCoupon})
    } catch (error) {
        console.log('errorroorrr')
        console.log(error.message)
    }
}
module.exports ={
    couponLoad,
    addCoupon,
    deleteCoupon,
    editCoupon
}