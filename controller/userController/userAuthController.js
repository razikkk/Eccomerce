
const User = require('../../models/userModel');
const Address=require('../../models/addressModel')
require('dotenv').config();
const bcrypt=require('bcrypt')


const sendMail=require('../../util/mailSender')
const generateOtp=require('../../util/generateOtp')



//password hashing
async function securePassword(password){
    const passwordHash=await bcrypt.hash(password,10)
    return passwordHash
}
  
// passport-setup.js
const passport = require('passport');
const { isLogin } = require('../../middleware/userAuth');
const { findById } = require('../../models/cartModel');
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
      done(error, false);
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
        res.redirect('/');
    }catch(error){
        console.log(error.message);
    }
    
  }





const loadHomePage=async(req,res)=>{
    try {
        // let userDetails;
        // // if(req.session.userId){
        //     // userDetails = await User.findById({_id:req.session.userId});
        // }

        // if(userDetails){
        //     // console.log("8888888888",userDetails,'9999999999999')
            
        // }else{
        //     console.log('hhshsh')
        //     res.render('home',{})
            
        // }

        res.render('home',{isLogin: req.session.userId ? true : false})
    } catch (error) {
        console.log(error.message)
    }
}
const loginLoad=async(req,res)=>{
   try {
         res.render('login',{isLogin: req.session.userId ? true : false})
   } catch (error) {
    console.log(error.message)
   }
}
const registerLoad = async (req, res) => {
  try {
    // let userDetails;
    // if(req.session.userId){
    //     userDetails=await User.findById({_id:req.session.userId})
    // }
    // if(userDetails){
    //     res.render('home',{name:userDetails.name})
    // }
    // else{
    //     res.render('home',{name:null})
    // }
    if (req.method == "GET") {
      console.log("4");
      res.render("registration", { isLogin: req.session.userId ? true : false });
    }

    if (req.method == "POST") {
      const { name, email, mobile, password } = req.body;

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
      };

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
    res.status(500).json({ error: error.message });
  }
};
const otp = async (req, res) => {
    try {
      res.render("otp", { isLogin: false });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
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
            return res.redirect('/');
        } else {
            return res.status(500).json({ message: "User registration failed." });
        }
      } else {
        return res.status(400).json({ message: "Invalid OTP. Please try again." });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
   

const loginHome=async(req,res)=>{
    try {
        res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
}


const verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        
         const userData = await User.findOne({email:email});
    
        
        //  console.log(email,password,userData,'hhhh')

        
   if(userData){
    const passwordMatch = await bcrypt.compare(password,userData.password);

   
    if(passwordMatch){

        req.session.userId=userData._id
        // console.log(req.session.userId,'loginn ayiii')
        
        
        res.redirect('/',);
    }else{
        res.render('login',{isLogin: req.session.userId ? true : false,message:'Password is Incorrect', data: {email,password}})
    }
   }else{
    res.render('login', {message: 'Please Enter an valid email', data: {email,password },isLogin: req.session.userId ? true : false})
   }
    } catch (error) {
        console.log(error.message);
    }
}

  const profileLoad = async (req, res) => {
    try {
      const userId = req.session.userId;
       
      if (!userId) {
        return res.status(401).send('Unauthorized');
      }
  
      let user= await User.findById(userId)
      res.render('profile',{user:user,isLogin: req.session.userId ? true : false})
    } catch (error) {
      console.log('Catch error:', error.message);
      res.status(500).send('Internal Server Error');
    }
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
        res.render('showAddress',{addresses,user:user,isLogin: req.session.userId ? true : false})
    } catch (error) {
        console.log(error.message)
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
        console.log(newAddress,'dhsidsa')
        // res.redirect('/profile/showAddress')
        res.status(201).json({ success: true, message: 'Address added successfully', addresses: newAddress });
    } catch (error) {
        console.log(error.message)
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
        
    }
  }

  const changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    try {
        // Find the user by ID
        const user = await User.findOne({ _id: req.session.userId });

        // If user not found, return error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the old password matches
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);

        // If passwords don't match, return error
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Check if newPassword and confirmPassword match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirm password do not match' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10); // Adjust the saltRounds as needed

        // Update user's password with the hashed password
        user.password = hashedPassword;

        // Save the updated user object
        await user.save();

        // Respond with success message
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
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
    changePassword

    
    
    
}