
const User = require('../../models/userModel');
const Address=require('../../models/addressModel')
const mongoose = require('mongoose');

require('dotenv').config();
const bcrypt=require('bcrypt')
const crypto=require('crypto')
const nodemailer=require('nodemailer')
const Order=require('../../models/orderModel')
const Product=require('../../models/products')
const sendMail=require('../../util/mailSender')
const generateOtp=require('../../util/generateOtp')
const Cart = require('../../models/cartModel')
const Wallet = require('../../models/walletModel')

const razorpay = require('razorpay')


const instance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
//password hashing
const securePassword = async (password) => {
  if (!password) {
    throw new Error('Password is required');
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

  
// passport-setup.js
const passport = require('passport');
const { isLogin } = require('../../middleware/userAuth');
// const { findById, findOne } = require('../../models/cartModel');
// const products = require('../../models/products');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENTID,
    clientSecret:process.env.CLIENTSECRET,
    callbackURL: process.env.CALLBACKURL
  },
  async (req,accessToken, refreshToken, profile, done) => {
    // Find or create the user in your database
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = await new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value
        }).save();
      }
     
      done(null, user);
    } catch (error) {
      console.log(error.message)
      res.render('500')
    }
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

const googleSuccess = async (req, res,next) => {
    try{
        req.session.userId=req.user._id
        const userId = req.session.userId
        let userWallet = await Wallet.findOne({userId:userId}) 
        if (!userWallet) {
          userWallet = new Wallet({
              userId: userId,
              balance: 0.00
          });
      }

      await userWallet.save();
        res.redirect('/');
    }catch(error){
      res.render('500')
        }
    
  }





const loadHomePage=async(req,res)=>{
    try {
      const bestSellers = await Product.find({isListed:false}).sort({sales:-1}).limit(10)
      if(!req.session.cartCount){
          req.session.cartCount = 0
      }

        res.render('home',{isLogin: req.session.userId ? true : false,bestSellers,cartCount:req.session.userId ? req.session.cartCount : 0})
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
}
const loginLoad=async(req,res)=>{
   try {
         res.render('Login',{isLogin: req.session.userId ? true : false})
   } catch (error) {
    console.log(error.message)
    res.render('500')
   }
}

const registerLoad = async (req, res) => {
  try {
    if (req.method == "GET") {
      res.render("registration", { isLogin: req.session.userId ? true : false,cartCount:req.session.userId ? req.session.cartCount : 0  });
    }

    if (req.method == "POST") {
      const { name, email, mobile, password,referralCode } = req.body;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      req.session.user = {
        name: name,
       
        email: email,
        mobile: mobile,
        password: hashedPassword,
        referralCode:generateReferralCode(),
        referralCodeUsed:referralCode || null
      };
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer) {
          referrer.balance += 10; // Add amount to referrer's balance (example amount)
          newUser.balance += 5; // Add amount to new user's balance (example amount)
          await referrer.save();
          await newUser.save();
        }
      }

      const otp = generateOtp();

      req.session.otp = otp;

      const mailResponse = await sendMail(
        email,
        "Verification Email",
        `This is your OTP ${otp}`
      );

      if(mailResponse){
          res.redirect('/registration/otp');
        }
     
    }
  } catch (error) {
    console.log(error.message)
    res.render('500')
    }
};
const otp = async (req, res) => {
    try {
      res.render("otp", { isLogin: false,cartCount:req.session.userId ? req.session.cartCount : 0 });
    } catch (error) {
      console.log(error.message)
      res.render('500')
        }
  };
  const otpMailSender = async (req, res) => {
    try {
      const email = req.session.user.email;
      const otp = await generateOtp();
  
      req.session.otp = otp;
  
      const mailResponse = await sendMail(
        email,
        "Verification Email",
        `This is your OTP ${otp}`
      );
  
      if (mailResponse) {
        res.status(200).json({ msg: "mail send successfully" });
      } else {
        res.status(500).json({ msg: "mail not send successfully" });
      }
    } catch (error) {
      console.log(error.message)
      res.render('500')
        }
  }; 
  const verifyOtp = async (req, res) => {
    try {
      if (req.session.otp === req.body.otpVal) {
        // console.log("otp is same");
        const newUser = new User({
          name: req.session.user.name,
          email: req.session.user.email,
          mobile: req.session.user.mobile,
          password: req.session.user.password,
          is_blocked: false,
          dateJoined: Date(),
        });
        console.log(newUser)
  
        const userData=await newUser.save();
        if (userData) {
            req.session.userId=userData._id
          const userId = req.session.userId
            let userWallet = await Wallet.findOne({userId:userId}) 
            if (!userWallet) {
              userWallet = new Wallet({
                  userId: userId,
                  balance: 0.00
              });
          }
  
          await userWallet.save();
            return res.redirect('/');
        } else {
            return res.status(500).json({ message: "User registration failed." });
        }
      } else {
        return res.status(400).json({ message: "Invalid OTP. Please try again." });
      }
    } catch (error) {
      console.log(error.message)
      res.render('500')
        }
  };
   

const loginHome=async(req,res)=>{
    try {
        res.redirect('/')
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
}


const verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        
         const userData = await User.findOne({email:email});
    console.log(userData)
        if(userData.is_blocked){
          return res.render('login',{message:"your account has been blocked",isLogin: req.session.userId ? true : false})
        }
        //  console.log(email,password,userData,'hhhh')

        
   if(userData){
    const passwordMatch = await bcrypt.compare(password,userData.password);

   
    if(passwordMatch){

        req.session.userId=userData._id
        console.log(req.session.userId, userData._id, 'loginn ayiii')

      
        const cartDatas = await Cart.findOne({ userId:userData._id }).populate("products.productId");
        if(cartDatas){
        console.log(cartDatas, '88')
        req.session.cartCount = cartDatas.products.length ? cartDatas.products.length : 0 
        }

        
        
        res.redirect('/',);
    }else{
        res.render('login',{isLogin: req.session.userId ? true : false,message:'Password is Incorrect', data: {email,password}})
    }
   }else{
    res.render('login', {message: 'Please Enter an valid email', data: {email,password },isLogin: req.session.userId ? true : false})
   }
    } catch (error) {
        console.log(error.message);
        res.render('500')
    }
}

  const profileLoad = async (req, res) => {
    try {
      const userId = req.session.userId;
       
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
  
      let user= await User.findById(userId)
      if (!user.referralCode) {
        user.referralCode = generateReferralCode();
        await user.save();
      }
      res.render('profile',{user:user,isLogin: req.session.userId ? true : false,cartCount:req.session.userId ? req.session.cartCount : 0 })
    } catch (error) {
      console.log('Catch error:', error.message);
      res.render('500')
        }
  };
  const generateReferralCode = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };
  

  const logout=async(req,res)=>{
    try {
        req.session.userId=null
            res.redirect('/')
            
    } catch (error) {
        console.log(error.message)
        res.redirect('/login')
    }
  }

  const loadshowAddress=async(req,res)=>{
    try {

        const userId = req.session.userId;
       
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
  
      let user= await User.findById(userId)
      const addresses=await Address.find({userId:userId})
        res.render('showAddress',{addresses,user:user,isLogin: req.session.userId ? true : false,cartCount:req.session.userId ? req.session.cartCount : 0 })
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
  }

  const addAddress=async(req,res)=>{
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
        res.status(201).json({ success: true, message: 'Address added successfully', addresses: newAddress });
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
  }

  const deleteAddress=async(req,res)=>{
    try {
        const {addressId}=req.params;
        console.log(addressId);
        if(!addressId){
            return res.status(400).json({success : false, message:'address id is required'})
        }
        const deleteAddress=await Address.findByIdAndDelete(addressId)
        if(!deleteAddress){
            return res.status(404).json({success : false, message:'no address found'})
        }
        return res.status(200).json({success : true, message:'address deleted sucessfully'})

    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
  }

  const editAddress=async(req,res)=>{
    try {
        const {name,street,city,state,zipcode,mobile}=req.body;
        const id=req.query.id;
        
        
       let edited= await Address.findByIdAndUpdate(id,{
            name,
            street,
            city,
            state,
            zipcode,
            mobile
        },{new : true})
        if(edited){
            res.status(200).json({success:true,message:'edited'})
        }else{
            res.status(400).json({sucess:false,message:'not edited'})
        }
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
  }

  const editProfile=async(req,res)=>{
    try {
        const {name,mobile}=req.body;
        const user=await User.findOne({_id:req.session.userId})

        user.name=name,
        user.mobile=mobile
        const updatedUser = await user.save()
        res.json({success:true, user:updatedUser})
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
  }

  const changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    try {
        const user = await User.findOne({ _id: req.session.userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(oldPassword, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10); 
        user.password = hashedPassword;

        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.render('500')
          }
};

const loadForgotPassword=async(req,res)=>{
  try {
    const userData=await User.findOne({_id:req.session.userId})
    res.render('forgotPassword',{isLogin: req.session.userId ? true : false,user:userData,cartCount:req.session.userId ? req.session.cartCount : 0 })
  } catch (error) {
    console.log(error.message)
    res.render('500')
  }
}
const resetPassword = async (req, res) => {
  try {
      const user = await User.findOne({ email: req.body.email });

      if (user) {
          if (user. googleId) {
              return res.status(400).json({ message: 'Unable to change password. Your account is linked with Google.' });
          }

          const token = crypto.randomBytes(20).toString('hex');
          req.session.token = token;
          req.session.email = req.body.email;

          const mailOptions = {
              from: process.env.EMAIL,
              to: req.body.email,
              subject: 'Your Password Reset Link',
              html: `
              <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                  <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                      <h3>Reset Your Password</h3>
                      <p>Click the link below to reset your password:</p>
                      <a href="http://localhost:3000/resetPassword?token=${token}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                      <p>Thanks for using our service!</p>
                      <p>Best regards,<br>The ESSENZI. Team,<br> Smell your Scents</p>
                  </div>
              </div>`
          };

          const transporter = nodemailer.createTransport({
              service: 'Gmail',
              port: 587,
              secure: true,
              auth: {
                  user: process.env.EMAIL,
                  pass: process.env.OTPPASS
              }
          });

          transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                  res.status(500).json({ message: 'Error sending email' });
              } else {
                  res.status(200).json({ message: 'Password reset link has been sent to your email' });
              }
          });

      } else {
          res.status(400).json({ message: 'No such email exists. Please create an account.' });
      }
  } catch (err) {
      console.log(err.message);
      res.render('500')
      }
};

const newPasswordForm = async (req, res) => {
  try {
      const token = req.query.token;

      if (!token) {
          return res.redirect('/login');
      }

      const userData = await User.findOne({ email: req.session.email });
      res.render('resetPassword', { token, user: userData, isLogin: req.session.userId ? true : false });
  } catch (error) {
      console.log(error);
      res.render('500')
    }
};


const newPassword = async (req, res) => {
  try {
      const token = req.body.token;
      const password = req.body.password;

      // Ensure the password is provided
      if (!password) {
          return res.status(400).json({ message: 'Password is required' });
      }

      if (token === req.session.token) {
          const hashedPassword = await securePassword(password);

          await User.findOneAndUpdate(
              { email: req.session.email },
              { password: hashedPassword }
          );

          delete req.session.token;

          res.status(200).json({ message: 'Password reset successful' });
      } else {
          res.status(400).send('Invalid token');
      }
  } catch (error) {
      console.log(error);
      res.render('500')
  }
};


const showOrderLoad = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .populate('items.productId', 'name images quantity')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.render('showOrder', {
      isLogin: userId ? true : false,
      orders,
      currentPage: page,
      totalPages,
      cartCount:req.session.userId ? req.session.cartCount : 0 
    });
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};


const showOrderDetails = async (req, res) => { 
  try {
    const orderId = req.params.orderId;
    const userId = req.session.userId; 
    const order = await Order.findById(orderId).populate("items.productId", 'name images price description discountPrice');
    
    if (!order) {
      return res.send("No order found");
    }

    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).send("Unauthorized access to this order");
    }

    res.render("showOrderDetails", {
      isLogin: req.session.userId ? true : false,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      order: order,
      cartCount:req.session.userId ? req.session.cartCount : 0 
    });
  } catch (error) {
    console.log(error.message);
    res.render('500');
  }
};


const cancelOrder=async(req,res)=>{
  try {
    const {orderId,itemId}=req.params
    const order=await Order.findById(orderId)
    if(!order){
      return res.status(404).json({success:false,message:"order not found"})
    }
    const item = order.items.id(itemId)
    if(!item){
      return res.status(404).json({success:false,message:"item not found"})
    }
    if(order.status !=='pending' || item.itemStatus!=='ordered'){
      return res.status(400).json({success:false,message:"cannot cancel order"})
    }
    item.itemStatus = 'cancelled'
    order.status = order.items.every( i => i.itemStatus === 'cancelled') ? 'cancelled' : order.status
    const product = await Product.findById(item.productId)
    if(!product){
      return res.status(404).json({success:false,message:"product not found"})
    }
   
    if (order.paymentMethod == 'RazorPay') {
      const totalPrice =product.discountPrice * item.quantity ;
      const userId = req.session.userId;
      let userWallet = await Wallet.findOne({ userId: userId });

      if (!userWallet) {
          userWallet = new Wallet({
              userId,
              balance: totalPrice,
              transactions: [{
                  type: 'credit',
                  amount: totalPrice,
                  description: 'Order canceled - refund added to wallet'
              }]
          });
      } else {
          userWallet.balance += totalPrice;
          userWallet.transactions.push({
              type: 'credit',
              amount: totalPrice,
              description: 'Order canceled - refund added to wallet'
          });
      }

      await userWallet.save();
  }

  product.stock += item.quantity;
  await product.save();
  await order.save();

  res.json({ success: true });

} catch (error) {
  console.log(error.message);
  res.render('500')
}
}


const getWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.redirect('/login'); 
    }

    const user = await User.findById(userId).populate('wishlist');

    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('addToWishlist', { isLogin: req.session.userId ? true : false, products: user.wishlist,cartCount:req.session.userId ? req.session.cartCount : 0  });
  } catch (error) {
    console.log(error.message);
    res.render('500')
    }
};



const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userId;

  try {
    const user = await User.findById(userId);
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message)
    res.render('500')
  }
};

// Remove from Wishlist
const removeFromWishlist = async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userId;

  try {
    const user = await User.findById(userId);
    user.wishlist = user.wishlist.filter(id => !id.equals(productId));
    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.render('500')
  }
};
const closeFromWishlist = async (req, res) => {
  try {
      const userId = req.session.userId;
      const productId = req.params.productId;

      if (!userId) {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.wishlist.pull(productId);
      await user.save();

      res.json({ success: true });
  } catch (error) {
      console.log(error.message);
      res.render('500')
    }
};

const walletLoad = async(req,res)=>{
  try {
    const userId = req.session.userId
    const currentPage = parseInt(req.query.page) || 1
    const itemPerPage = 5
    const walletCount = await Wallet.countDocuments({userId:userId})
    const totalPages = Math.ceil(walletCount/itemPerPage)
    const wallet = await Wallet.find({userId:userId}).skip((currentPage-1)*itemPerPage).limit(itemPerPage).sort({date:-1})
    res.render('wallet',{isLogin: req.session.userId ? true : false,wallet:wallet,razorpayKey: process.env.RAZORPAY_KEY_ID,currentPage:currentPage,totalPages:totalPages,cartCount:req.session.userId ? req.session.cartCount : 0 })
  } catch (error) {
    console.log(error)
    res.render('500')
  }
}

const returnOrderRequest = async (req, res) => {
  const { orderId, itemId, reason } = req.body;
  try {
      const order = await Order.findById(orderId);
      const item = order.items.id(itemId);

      if (!item) {
          return res.status(404).json({ success: false, message: 'Item not found' });
      }

      item.returnStatus = 'requested';
      item.returnReason = reason;

      await order.save();
      res.json({ success: true, message: 'Return request submitted' });
  } catch (error) {
      console.error(error);
      res.render('500')
  }
};

const createOrder = async (req, res) => {
  try {
      const { amount } = req.body;
      const options = {
          amount: amount, // Amount in paise
          currency: "INR",
          receipt: "receipt#1"
      };
      const order = await instance.orders.create(options);
      res.json({ orderId: order.id });
  } catch (error) {
      console.error('Error creating order:', error);
      res.render('500')
  }
};
const verifyPaymentWallet = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;

  const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

  if (generatedSignature === razorpay_signature) {
      // Payment is verified
      const numericAmount = Number(amount);

      const userId = req.session.userId;
      let userWallet = await Wallet.findOne({ userId: userId });
      if (!userWallet) {
          userWallet = new Wallet({
              userId: userId,
              balance: numericAmount
          });
      } else {
          userWallet.balance += numericAmount;
      }
      await userWallet.save();
      res.json({ success: true });
  } else {
      res.json({ success: false, message: 'Invalid signature' });
  }
};
module.exports={
    loadHomePage,
    loginLoad,
    generateOtp,
    sendMail,
    registerLoad,
    otp,
    otpMailSender,
    verifyOtp,
    loginHome,
    verifyLogin,
    profileLoad,
    googleSuccess,
    logout,
    loadshowAddress,
    addAddress,
    deleteAddress,
    editAddress,
    editProfile,
    changePassword,
    loadForgotPassword,
    resetPassword,
    newPasswordForm,
    newPassword,
    showOrderLoad,
    showOrderDetails,
    cancelOrder,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    closeFromWishlist,
    walletLoad,
    returnOrderRequest,
    createOrder,
    verifyPaymentWallet

    

    
    
    
}