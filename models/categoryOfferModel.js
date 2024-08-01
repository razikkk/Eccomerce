const mongoose = require('mongoose')
const Schema = mongoose.Schema
const categoryOfferSchema = new Schema({
    
    
    
   
    categoryId:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:false
    },
    percentage:{
        type:Number,
        required:true
    },
    
    expiryDate:{
        type: Date,
        index:{expires:0}

    }
})

module.exports = mongoose.model("categoryOffer",categoryOfferSchema)