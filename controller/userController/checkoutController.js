const Address=require('../../models/addressModel')
const Cart=require('../../models/cartModel')










const checkoutLoad=async(req,res)=>{
    try {
        const user=req.session.userId
        const address=await Address.find({userId:user})
        const cartDatas=await Cart.findOne({userId:user}).populate("products.productId");

        res.render('checkout',{user:user,isLogin: req.session.userId ? true : false,address:address,cartDatas:cartDatas})
    } catch (error) {
        console.log(error.message)
    }
}
const checkOutAddAddress=async(req,res)=>{
    try {
        const userId=req.session.userId
        const {name,street,city,state,zipcode,mobile}=req.body;
        
        const newAddress=new Address({
            userId:userId,
            name:name,
            street:street,
            city:city,
            state:state,
            zipcode:zipcode,
            mobile:mobile
        })
        await newAddress.save()
        console.log(newAddress,'dhsidsa')
        // res.redirect('/profile/showAddress')
        res.status(201).json({ success: true, message: 'Address added successfully', addresses: newAddress });
    } catch (error) {
        console.log(error.message)
    }
  }


module.exports={
    checkoutLoad,
    checkOutAddAddress
}