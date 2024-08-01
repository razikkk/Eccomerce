

const { log } = require('console');
const adminModel = require('../../models/adminModel');
const Category = require('../../models/category')
const Order = require('../../models/orderModel')
const bcrypt = require('bcrypt');
const { getSystemErrorMap } = require('util');
const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types
// const multer=require('multer')


const loadAdminLogin = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error, 'from the load admin login')
    }
};

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await adminModel.findOne({ email: email });

        //  console.log(email,password,userData,'hhhh')
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                req.session.adminId = userData._id
                res.redirect('/admin/dashboard');

            }

            else {
                res.render('login', { message: 'Password is Incorrect', data: { email, password } })
            }
        } else {
            res.render('login', { message: 'Please Enter an valid email', data: { email, password } })
        }

    } catch (error) {
        console.log(error.message);
    }
}


const dashboardLoad = async (req, res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        console.log(error.message)
    }
}



const categoryLoad = async (req, res) => {
    try {
        const category = await Category.find({ is_delete: false })
        res.render('category', { category: category })
    } catch (error) {
        console.log(error.message)
    }
}

const loadAddCategory = async (req, res) => {
    try {
        res.render('addCategory')
    } catch (error) {
        console.log(error.message)
    }
}

const addCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;
        const existingCategory = await Category.findOne({ categoryName })
        if (existingCategory) {
            return res.json({ success: false, message: 'category name already exists' })

        }
        const category = new Category({
            categoryName
        });

        await category.save()
        res.json({ success: true, message: 'category added successfully' })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message)
    }
}

// const loadEditCategory=async(req,res,next)=>{
//     try {
//         const id=req.query.id;
//         const category=await Category.findOne({_id:id})
//         if(category){

//             res.render('editCategory',{category:category})
//         }
//     } catch (error) {
//         console.log(error.message)
//     }
// }

const editCategory = async (req, res) => {
    try {
        const already = await Category.findOne({ categoryName: req.body.categoryName })
        if (already) {
            return res.redirect('/admin/category')
        }
        await Category.findByIdAndUpdate(
            { _id: req.body.categoryId },
            { $set: { categoryName: req.body.categoryName } },
        )
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message);
    }
}

const deleteCatergory = async (req, res) => {
    try {
        let updated = await Category.findByIdAndUpdate(
            { _id: req.query.id },
            { $set: { is_delete: true } }
        )
        if (updated) {
            res.json({ success: true })
        }
    } catch (error) {
        console.log(error.message)
    }
}
const loadDeletedCategory = async (req, res) => {
    try {
        const deleteCategories = await Category.find({ is_delete: true })
        res.render('deletedCategory', { category: deleteCategories })

    } catch (error) {
        console.log(error.message)
    }
}

const restoredCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;
        const categoryItem = await Category.findById(categoryId);
        if (categoryItem) {
            await Category.findByIdAndUpdate(categoryId, { is_delete: false });
            res.status(200).json({ message: 'resotred', success: true })
        }
        else {
            res.status(404).json({ message: 'not found' })
        }
    } catch (error) {
        console.log(error.message)
    }
}

const logout = async (req, res) => {
    try {
        req.session.userId = null
        res.redirect('/admin/login')

    } catch (error) {
        console.log(error.message)
        res.redirect('/admin/dashboard')
    }
}
const filterSalesInterval = async (req, res) => {
    try {
        const interval = req.query.interval
        let startDate;
        let today = new Date()
        today.setHours(0, 0, 0, 0)
        
        switch (interval) {
            case "daily":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate())
                break;
            case "weekly":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() - 7
                )
                break;
                case "monthly":
                    startDate = new Date(
                        today.getFullYear(),
                        today.getMonth()-1,
                        today.getDate()
                    )
                    break;
                    case "yearly":
                    startDate = new Date(
                        today.getFullYear()-1,
                        today.getMonth(),
                        today.getDate()
                    )
                    break;
                    default:
                        startDate = new Date()
                        break;
        }

        let endDate = new Date()
        endDate.setHours(23,59,59,999)

        let orderData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $match: {
                    "items.itemStatus": "delivered",
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $sort: {
                    date: -1
                }
            }
        ]);

        let totalSales = orderData.length
       res.render('salesReport',{orders:orderData,totalSales})
    } catch (error) {
        console.log(error.message)
    }
}

const filterSalesReport = async(req,res)=>{
    try {
        const startDate = new Date(req?.query?.startDate)
        const endDate = new Date(req?.query?.endDate)

        endDate.setHours(23,59,59,999)
        let orderData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $match: {
                    "items.itemStatus": "delivered",
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $sort: {
                    date: -1
                }
            }
        ]);
        let totalSales = orderData.length
        res.render('salesReport',{ orders: orderData,totalSales})
    } catch (error) {
        console.log(error.message)
    }
}

const salesReportLoad = async (req, res) => {
    try {


        let orderData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $match: {
                    "items.itemStatus": "delivered",
                    
                }
            },
            {
                $sort: {
                    date: -1
                }
            }
        ]);
        console.log(orderData)
        let totalSales = orderData.length;

        res.render('salesReport',{orders:orderData,totalSales})
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = {
    loadAdminLogin,
    dashboardLoad,
    verifyLogin,
    categoryLoad,
    loadAddCategory,
    addCategory,
    editCategory,
    deleteCatergory,
    loadDeletedCategory,
    restoredCategory,
    logout,
    salesReportLoad,
    filterSalesInterval,
    filterSalesReport



}