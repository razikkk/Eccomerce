const { isLogin } = require('../../middleware/userAuth')
const Product=require('../../models/products')

const Category=require('../../models/category')



const loadShop = async (req, res) => {
    try {
        const userId = req.session.userId;
        const category = req.query.category || '';
       
        const minPrice = req.query.minPrice || '';
        const maxPrice = req.query.maxPrice || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const sortOption = req.query.sort || 'popularity';
        const searchQuery = req.query.search || '';
        let filter = { isListed: false };
        if (category) {
            const categoryData = await Category.findOne({ categoryName: new RegExp(category, 'i') });
            if (categoryData) {
                filter.categoryId = categoryData._id;
            } else {
                filter.categoryId = null;
            }
        }
        
        if (minPrice && maxPrice) {
            filter['discountPrice'] = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
        } else if (minPrice) {
            filter['discountPrice'] = { $gte: parseFloat(minPrice) };
        } else if (maxPrice) {
            filter['discountPrice'] = { $lte: parseFloat(maxPrice) };
        }
        const searchFilter = searchQuery ? {
            name: { $regex: new RegExp(searchQuery, 'i') }
        } : {};
        const combinedFilter = { ...filter, ...searchFilter };
        console.log(combinedFilter,'ith');
        const totalProducts = await Product.countDocuments(combinedFilter);
        const products = await Product.aggregate([
            { $match: combinedFilter },
            {
                $addFields: {
                    minPrice: { $min: "$discountPrice" },
                    maxPrice: { $max: "$discountPrice" }
                }
            },
            { $sort: getSortCriteria(sortOption) },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]).collation({ locale: "en", strength: 2 });
        console.log(totalProducts);
        console.log(combinedFilter);
        console.log(products);
        const categories = await Category.find({ is_delete: false });
        
       
        res.render('shop', {
            products,
            categories,
           
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts,
            sort: sortOption,
            search: searchQuery,
            category,
            
            minPrice,
            maxPrice,
            isLogin:req.session.userId?true:false
            
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};

function getSortCriteria(sortOption) {
    switch (sortOption) {
        case 'price-asc':
            return { 'discountPrice': 1 };
        case 'price-desc':
            return { 'discountPrice': -1 };
        case 'name-asc':
            return { name: 1 };
        case 'name-desc':
            return { name: -1 };
        case 'rating-asc':
            return { rating: 1 };
        case 'rating-desc':
            return { rating: -1 };
        case 'new-arrivals':
            return { createdAt: -1 };
        case 'popularity':
            return { orderCount: -1 };
        case 'popularity':
        default:
            return { popularity: -1 };
    }
};




const loadProductDetails=async(req,res)=>{
    try {
        let productDetail=await Product.findById(req.params.productId)
      
        res.render('productDetails',{isLogin:req.session.userId?true:false,productDetail})
    } catch (error) {
        console.log(error.message)
    }
}





module.exports={
    loadShop,
    
    loadProductDetails
    
}