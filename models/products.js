const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {ObjectId} = require("mongodb")

const productSchema=new Schema({
    name:{
        type:String,
        required:true

    },
    categoryId: { 
        type: ObjectId,
         ref: "Category",
        required: true
    },
    description:{
        type:String,
        required:true
    },
    images:{
        type:[String],
        required:true,
        default:[]
    },
    price:{
        type:Number,
        required:true
    },
    discountPrice:{
        type:Number
    },
    stock:{
        type:Number,
        required:true
    },
    isListed:{
        type:Boolean,       
        default:false
    },
    date: {
        type: Date,
        default: Date.now,
      }

})
module.exports=mongoose.model('product',productSchema)