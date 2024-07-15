const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
    
  if (req.session.userId) {
    next()
    
  
   }
   else {
    res.redirect("/login");
  }
};

const isLogout = (req, res, next) => {
  if (!req.session.userId) {
    next();
  } else {
    res.redirect("/");
  }
};






module.exports = {
  isLogin,
  isLogout,

  
};