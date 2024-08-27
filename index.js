require('dotenv').config()
const express=require('express')
const app=express()
const connectDb = require('./config/db')
const path = require('path');
const userRoute=require('./routes/userRoutes');
const nocache =require('nocache')
const adminRoute=require('./routes/adminRoutes')
const {v4:uuidv4}=require('uuid')
const session=require('express-session')
 connectDb()

app.use(nocache())


app.use(session({
  secret:uuidv4(),
  resave:false,
  saveUninitialized:true
}))

// //mongodb connect
// const mongoose=require('mongoose')
// mongoose.connect(process.env.MONGODB)

//engine
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));
app.use("/static",express.static(path.join(__dirname,"public")));
app.use(express.static(path.join(__dirname, 'controller','public')));
//user route
app.use('/',userRoute)
app.use('/admin',adminRoute)

//destroy otp
app.get("/auth/destroy-otp", (req, res) => {
    delete req.session.otp;
    res.send(200).json({ message: "OTP expired?"  });
  });

  app.use((req,res,next)=>{
    res.status(404).render('userViews/404')
  })

app.listen(3000,()=>{
    console.log(`http://localhost:3000`)
})