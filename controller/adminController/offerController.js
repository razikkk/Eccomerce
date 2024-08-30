const category = require('../../models/category')
const Category = require('../../models/category')
const categoryOffer = require('../../models/categoryOfferModel')
const productOffer = require('../../models/productOfferModel')
const Product = require('../../models/products')
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

const addCategoryOffer = async (req, res) => {
    const { categoryId, percentage, expiryDate } = req.body;
    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

      

        const products = await Product.find({ categoryId: category._id }).populate('categoryId', 'name');

        for (let product of products) {
            const originalPrice = product.price;
            const discountAmount = (originalPrice * percentage) / 100;
            const discountPrice = Math.ceil(originalPrice - discountAmount);

            product.discountPrice = discountPrice; // Set the new discount price
            await product.save();
        }

        const newOffer = new categoryOffer({
            categoryId,
            percentage,
            expiryDate
        });
        await newOffer.save();

        res.status(200).json({ success: true, message: "Offer added successfully" });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
const editCategoryOffer = async (req, res) => {
    try {
        const { offerId, categoryId, percentage, expiryDate } = req.body;
        if (!offerId || !categoryId || !percentage || !expiryDate) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const offer = await categoryOffer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const products = await Product.find({ categoryId: category._id }).populate('categoryId', 'name');

        for (let product of products) {
            const originalPrice = product.price;
            const discountAmount = (originalPrice * percentage) / 100;
            const discountPrice = Math.ceil(originalPrice - discountAmount);

            product.discountPrice = discountPrice; // Update the discount price
            await product.save();
        }

        offer.categoryId = categoryId;
        offer.percentage = percentage;
        offer.expiryDate = expiryDate;
        await offer.save();

        res.status(200).json({ success: true, message: "Offer edited successfully" });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
const deleteCategoryOffer = async (req, res) => {
    try {
        const { offerId } = req.body;
        if (!offerId) {
            return res.status(400).json({ success: false, message: "Offer ID is required" });
        }

        const offer = await categoryOffer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        const category = await Category.findById(offer.categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const products = await Product.find({ categoryId: category._id });

        for (let product of products) {
            product.discountPrice = Math.floor(product.price - (product.price * 0.05)); 
            await product.save();
        }

        await categoryOffer.findByIdAndDelete(offerId);

        res.status(200).json({ success: true, message: "Offer deleted successfully" });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const productOfferLoad = async(req,res)=>{
    try {
        const offers = await productOffer.find({}).populate("productId")
        const products = await Product.find({isListed:false})
        res.render("productOffer",{offers,products})
    } catch (error) {
        console.log(error.message)
    }
}
const addProductOffer = async(req,res)=>{
    try {
        const {productId,percentage,expiryDate} = req.body;
        console.log(productId,percentage,expiryDate);

        if(!productId || !percentage || !expiryDate){
            return res.status(400).json({success:false,message:"all fields are required"})
        }
        const productData = await Product.findById(productId)
        if(!productData){
            return res.status(404).json({success:false,message:"product  is not found"})
        }
        const originalPrice = productData.price
        const discountAmount = (originalPrice * percentage)/100
        const result = Math.ceil(discountAmount)
        if(discountAmount > productData.discountPrice){
            productData.discountPrice = result
            await productData.save()
        }


        const newOffer = new productOffer({
            productId : productId,
            percentage : percentage,
            expiryDate : expiryDate
        })
        console.log(newOffer)
        await newOffer.save()
        res.status(200).json({success:true,message:"offer added successfully"})
    } catch (error) {
        console.log(error.message)
    }
}

const editProductOffer = async(req,res)=>{
    try {
        const {offerId,productId,percentage,expiryDate} = req.body
        if(!productId || !percentage || !expiryDate){
            return res.status(404).json({success:false,message:"all fields are required"})
        }

        const productData = await Product.findById(productId)
        if(!productData){
            return res.status(404).json({success:false,message:"product  is not found"})
        }
        const originalPrice = productData.price
        const discountAmount = (originalPrice * percentage)/100
        const result = Math.ceil(discountAmount)
        if(discountAmount > productData.discountPrice){
            productData.discountPrice = result
            await productData.save()
        }
        
        await productOffer.findByIdAndUpdate(offerId,{
            productId,
            percentage,
            expiryDate
        })
        res.status(200).json({success:true,message:"edited successfully"})
    } catch (error) {
        console.log(error.message)
    }
}

const deleteProductOffer = async(req,res)=>{
    try {
        const {offerId} = req.body
        if(!offerId){
            return res.status(400).json({success:false,message:"id is required"})
        }
        const offer = await productOffer.findById(offerId).populate('productId')
        const productId = offer.productId
        console.log(productId)
        console.log(offerId,'1122')
        const product = await Product.findById(productId)

        if(!product){
            return res.status(404).json({success:false,message:"product not found"})
        }
        product.discountPrice = Math.floor(product.price - (product.price * 0.05)); 
        await product.save()

        const a = await productOffer.findByIdAndDelete(offerId)
        console.log(a);
        res.status(200).json({success:true,message:"offer deleted successfully"})
    } catch (error) {
        console.log(error.message)
    }
}
module.exports = {
    categoryOfferLoad,
    addCategoryOffer,
    editCategoryOffer,
    deleteCategoryOffer,
    productOfferLoad,
    addProductOffer,
    editProductOffer,
    deleteProductOffer
}