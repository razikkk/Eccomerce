const Category = require('../../models/category')
const categoryOffer = require('../../models/categoryOfferModel')
const { googleSuccess } = require('../userController/userAuthController')
const categoryOfferLoad = async(req,res)=>{
    try {
        const categories = await Category.find({is_delete:false})
        const offers = await categoryOffer.find({}).populate('categoryId');
        // console.log(offers,'hy')
        res.render('categoryOffer',{categories,offers})
    } catch (error) {
        
    }
}

const addCategoryOffer = async(req,res)=>{
   
    const {categoryId,percentage,expiryDate} = req.body
    try {
        const newOffer =new categoryOffer({
            categoryId,
            percentage,
            expiryDate
        })
        console.log(categoryId,'ii')
        await newOffer.save()
        res.status(200).json({success:true,message:"offer added"})

    } catch (error) {
        console.log(error.message)
        res.status(404).json({success:false})
    }
}
module.exports = {
    categoryOfferLoad,
    addCategoryOffer
}