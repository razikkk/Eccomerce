const Product=require('../../models/products')
const Category=require('../../models/category')
// const { is_blocked } = require('../../middleware/userAuth');
const { log } = require('console');
const sharp=require('sharp')
const path=require('path')
const fs=require('fs')






const productsLoad=async(req,res)=>{
    try {
        let ProductData=await Product.aggregate([
            {
              $match:{
                    isListed:false
                }
            },
            {
                $lookup:{
                    from:"categories",
                    localField:"categoryId",
                    foreignField:"_id",
                    as:"category"
                }
            },
            {$unwind:"$category"}
        ])
        res.render('products',{product:ProductData})
    } catch (error) {
        console.log(error.message)
    }
}
const loadAddproduct=async(req,res)=>{
    try {
     const category=   await Category.find({is_delete:false})
        res.render('addProduct',{category:category})
    } catch (error) {
        console.log(error.message)
    }
}

const checkAlready=async(req,res)=>{
    try {
        const productName=req.query.productName.trim();
        const id=req.query.id || null;
        const query={
            name:{$regex:`^${productName}$`,$options:"i"}
        };
        if(id){
            query._id={$ne:id}
        }
        const already=await Product.find(query);
        if(already.length>0){
            res.json({success:false})
        }
        else{
            res.json({success:true})
        }
        
    } catch (error) {
        console.log(error.message)
    }
}

const addProduct = async (req, res) => {
    try {
        const { name, category, quantity, price, discountprice, description } = req.body;
        const images = req.files.map(file => file.filename); // Extract filenames from uploaded files

        if (!name || !category || !quantity || !price || !description) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled' });
        }

        // Create new product (adjust as per your Product model)
        const newProduct = new Product({
            name:name,
            categoryId:category,
            price:price,
            discountPrice:discountprice,
            stock:quantity,
            description:description,
            images:images,
            date:new Date()
        });
        await newProduct.save();

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error adding product:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const loadDeleteProduct=async(req,res)=>{
  
        try {
            const id = req.query.id;
            let updated=await Product.findByIdAndUpdate(
                {_id:id},
                {$set:{isListed:true}}
            )
            if(updated){
                res.json({success:true})
            }
        } catch (error) {
            console.log(error.message)
        
    
}}

const loadDeletedProduct = async (req, res) => {
    try {
      const productData = await Product.aggregate([
        {
          $match: {
            isListed: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: "$category"
        }
  
      ])
      res.render("deletedProduct", { product: productData })
    } catch (error) {
      console.log(error.message);
    }
  }
   const restoreProduct=async(req,res)=>{
    try {
        const productId=req.query.id;
        const productData=await Product.findByIdAndUpdate(productId,{isListed:false},{new:true});
        if(!productData){
            return res.status(404).json({message:'product not found'})
        }
        res.status(200).json({message:'product restored'})
    } catch (error) {
        console.log(error.message)
    }
   }
   const loadEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const category = await Category.find({ is_delete: false });
        const product = await Product.findOne({ _id: id });

        if (!product) {
            return res.status(404).send('Product not found');
        }

        console.log("Categories:", category);
        console.log("Product:", product);

        return res.render("editProduct", { product, category });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};




const editProduct = async (req, res) => {
    try {
        const { categoryName, productName, price, discountPrice, quantity, productDescription, deletedImages } = req.body;
        const id = req.query.id;

        const category = await Category.findOne({ categoryName: categoryName });
        
        if (!category) {
            return res.status(404).send('Category not found');
        }

        const product = await Product.findByIdAndUpdate(
            { _id: id },
            {
                $set: {
                    name: productName,
                    categoryId: category._id,
                    price: price,
                    discountPrice: discountPrice,
                    stock: quantity,
                    description: productDescription
                }
            },
            { new: true }
        );

        if (deletedImages.length > 0) {
            for (let index of deletedImages) {
                product.images.splice(Number(index), 1);
            }
        }

        const uploadDir = path.join(__dirname, '..','..', 'public', 'user', 'images');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const file of req.files) {
            const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
            const filename = `cropped_${uniqueSuffix}_${file.originalname}`;
            const filepath = path.join(uploadDir, filename);

            fs.copyFileSync(file.path, filepath);

            product.images.push(filename);
        }

        await product.save();
        res.status(200).json({ message: "updated" });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


module.exports={
    productsLoad,
    loadAddproduct,
    checkAlready,
    addProduct,
    loadEditProduct,
    loadDeleteProduct,
    loadDeletedProduct,
    restoreProduct,
    editProduct
    
}