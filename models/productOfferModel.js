const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productOfferSchema = new Schema({
    productId:{
        type:mongoose.Types.ObjectId,
        ref:"product",
        required:true
    },
    percentage:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:Date,
        index:{expires:0}
    }
})
module.exports = mongoose.model('productOffer',productOfferSchema)