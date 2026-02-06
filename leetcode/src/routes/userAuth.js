const express = require('express');

const router = express.Router();
const {register,login,logout,adminRegister,deleteProfile} = require('../controllers/userAuth'); // for controller
const usermiddleware = require('../middleware/userMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
// register
router.post('/register', register);// basically register,login,logout,getprofile these are just function and we will make those function in our controller and function are those who is in blue color
router.post('/login',login);
router.post('/logout', usermiddleware , logout);
router.post('/admin/register',adminMiddleware,adminRegister);
router.delete('/deleteProfile',usermiddleware,deleteProfile)  // if user wants to delete his profile
router.get('/check',usermiddleware,(req,res)=>{
    const reply = {
        firstName: req.result.firstName,
        lastName: req.result.lastName,
        emailId: req.result.emailId,
        _id:req.result._id,
        role:req.result.role,
    }

    res.status(200).json({
        user:reply,
        message:"valid user"
    });
})
// router.get('/profile',getprofile);

module.exports = router;
// login
// logout
// Get Profile 