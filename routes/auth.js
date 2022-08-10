const express = require('express');

const User = require('../models/User');

const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = ".envFile/configFile";

const fetchuser = require('../middleware/fetchuser');

// Route 1: Create a new account for a user using POST "/api/auth/createaccount". No login required.
router.post('/createaccount', async (req, res)=>{
    
    let success=false;

    try {
        let user = await User.findOne({email: req.body.email});
        if(user){
            return res.status(400).json({success, error: 'A accout exists with this email, please try to login'});
        }
        success = true;
        const salt = await bcrypt.genSalt(10);
        const securedPassword = await bcrypt.hash(req.body.password, salt);

        user = await User.create({
            username: req.body.username,
            email: req.body.email,
            mobileNumber: req.body.mobileNumber,
            password: securedPassword
        })
        const data = {
            user:{
                username: user.username,
                email: user.email
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);

        res.json({success, authToken: authToken, username: user.username});

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error.");
    }
})

//Router 2: Authenticate a user using POST "/api/auth/login". No login required.

router.post('/login', async (req, res)=>{

    let success=false;

    try {
        const {email, password} = req.body;
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({success, error: "Invalid Email"});
        }
        const comparePassword = await bcrypt.compare(password, user.password);
        if(!comparePassword){
            return res.status(400).json({success, error: "Invalid Password"});
        }
        
        const data = {
            user: {
                username:user.username,
                email: user.email
            },
        }

        authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        console.log(user.username);
        res.json({success, authToken, username: user.username});
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error.");
    }
})

router.post('/getuser',  async(req, res)=>{

    try {
        // const email = req.user.email;
        // console.log(username);
        const user = await User.findOne({username: req.body.username}).select("-password");

        res.json({user});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success, error: "Invalid Email"});

    }

})

router.post('/placedbids', fetchuser, async(req, res)=>{
    try{
        const user = await User.findOneAndUpdate({email: req.user.email},
                {$push: {
                    "placedBids": req.body.filename
                }}
            );
        res.json({user})
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({error: "Internal Server Error"});

    }
})

router.post('/getplacedbids', fetchuser, async(req, res)=>{
    try{
        const user = await User.findOne({email: req.user.email});
        res.json({placedBids: user.placedBids});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({error: "Internal Server Error"});

    }
})

router.post('/authoriseUser', fetchuser, async(req, res)=>{

    try {
        const user = await User.findOne({email: req.user.email})
        res.json({user});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success, error: "Invalid Email"});

    }

})

router.get('/allusers', async(req, res)=>{

    try {
        const users = await User.find()
        res.json({users});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success, error: "Internal Server Error"});

    }

})

module.exports = router;