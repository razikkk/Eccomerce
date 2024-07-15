const { ObjectId } = require('bson')
const mongoose=require('mongoose')


const cartSchema= new mongoose.Schema({
    userId:{
        type:ObjectId,
        ref:'User',
        required:true
    },

  products:[{
        productId:{
            type:ObjectId,
            ref:"product",
            required:true
        },
        quantity:{
            type:Number,
            required:true,
            default:1
        }

    }
     
    ]
})

module.exports=mongoose.model('Cart',cartSchema)