const mongoose =require('mongoose')
const Schema = mongoose.Schema

const couponSchema = new Schema({
    couponCode:{
        type:String,
        unique:true,
        required:true
    },
    percentage:{
        type:Number,
        required:true
    },
    minAmount:{
        type:Number,
        required:true
    },
    maxRedeemAmount:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true,
        index:{expires:0}
    },
    usedBy:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }]
})

module.exports = mongoose.model('Coupon',couponSchema)
