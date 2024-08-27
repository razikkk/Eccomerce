const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
    
    if(req.session.userId){
      const user = await User.findOne({
        _id:req.session.userId,
        is_blocked:false
      })
      if(user){
        next()
      }else{
        if(req.session.userId){
          delete req.session.userId
          res.redirect("/login");
        }
      }
    }
    

};

const isLogout = (req, res, next) => {
  if (!req.session.userId) {
    next();
  } else {
    res.redirect("/");
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { // assuming you're using something like Passport.js
      return next();
  }
  res.redirect('/login'); // or you can send a 401 Unauthorized response
};




module.exports = {
  isLogin,
  isLogout,
  isAuthenticated

  
};