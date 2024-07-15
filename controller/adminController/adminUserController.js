const Users=require('../../models/userModel')


const loadUser=async(req,res)=>{
    try {
        const usersList= await Users.find()
        res.render('users',{users:usersList})
        
    } catch (error) {
        console.log(error.message)
    }
}

const block=async(req,res)=>{
    try {
        let userId=req.query.userId
         await Users.findByIdAndUpdate({_id:userId},{$set:{is_blocked:true}})
         res.json({success:true})
    } catch (error) {
        console.log(error.message)
    }
}
const unblock=async(req,res)=>{
    try {
        let userId=req.query.userId
         await Users.findByIdAndUpdate({_id:userId},{$set:{is_blocked:false}})
         res.json({success:true})
    } catch (error) {
        console.log(error.message)
    }
}





module.exports={
    loadUser,
    block,
    unblock
}
