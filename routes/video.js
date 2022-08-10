const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video')
const multer  = require('multer')
const fetchuser = require('../middleware/fetchuser');

// Route 1: 

var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './public/uploads')
    },
    filename: function(req, file, cb){
        cb(null, `${Date.now()}_${file.originalname}` )
    },
    fileFilter: (req, file, cb) => {
        const extention = path.extname(file.originalname);
        if(extention !== ".mp4"){
            return cb(res.status(400).end('Only mp4 file is allowed'), false);
        }
    }
})

var upload = multer({ storage });

router.post('/upload', upload.single('file') ,async (req, res)=>{
    // upload(req, res, err => {
    //     if(err){
    //         console.log(err);
    //         return res.json({a: false, err});
    //     }
    //     return res.json({success: true, filePath: res.req.file.path, fileName: req.req.file.filename})
    // })

    await User.updateOne({username: req.body.username}, { $push: { "posts": req.file.filename } } );

    await Video.create({
        filename: req.file.filename,
        author: req.body.username,
        amount: req.body.amount,
        equity: req.body.equity
    })

    console.log(req.file);
    res.json({success:true, file: req.file});
})

router.post('/like', fetchuser, async (req, res)=>{
    
    try {
        const {filename} = req.body;
        await Video.findOneAndUpdate({filename: filename}, 
            {$push: {
                "likes": {username: req.user.username}
            }});
        const video = await Video.findOne({filename});
        res.json({likes: video.likes});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})

router.post('/dislike', fetchuser, async (req, res)=>{
    
    try {
        const {filename} = req.body;
        await Video.findOneAndUpdate({filename: filename}, 
            {$pull: {
                "likes": {username: req.user.username}
            }});
        const video = await Video.findOne({filename});
        res.json({likes: video.likes});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }

})


router.post('/alreadyliked', fetchuser, async (req, res)=>{
    
    try {
        const {filename} = req.body;
        const isLiked = await Video.findOne({filename: filename, likes: {username:req.user.username} })
        res.json({isLiked});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }

})

router.post('/getlikes', async (req, res)=>{
    
    try {
        const {filename} = req.body;
        
        const video = await Video.findOne({filename});

        res.json({totalLikes: video.likes.length});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
    

})

router.get('/getvideos', async (req, res)=>{
    
    let videos = await Video.find();
    res.json(videos);

})

router.post('/getuservideos', async (req, res)=>{
    
    let videos = await Video.find({author: req.body.username});
    res.json(videos);

})

router.post('/placebid',fetchuser, async(req, res)=>{
    
    try {
        const {filename, bidamount, bidequity} = req.body;
        const bidplacer = req.user.name;
        await Video.findOneAndUpdate({filename: filename}, 
            {$push: {
                "bids": {amount: bidamount, equity: bidequity, bidplacer}
            }});
        const video = await Video.findOne({filename});
        console.log(video.bids);
        res.json({bids: video.bids})

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }

})

router.post('/getbids',fetchuser, async(req, res)=>{
    
    try {

        const video = await Video.findOne({filename: req.body.filename});
        res.json({bids: video.bids});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }

})

router.post('/alreadysaved', fetchuser, async (req, res)=>{
    
    try {
        // const isLiked = await Video.findOne({filename: filename, likes: {username:req.user.username} })

        const isSaved = await User.findOne({username: req.user.username})
        for (var i=0; i<isSaved.saved.length; i++){
            // console.log(i, isSaved.saved[i].filename);
            if(isSaved.saved[i].filename === req.body.filename){
                return res.json({saved: true})
            }
        }
        res.json({saved: false});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }

})

router.post('/save', fetchuser, async(req, res)=>{
    try {

        const video = await Video.findOne({filename: req.body.filename});

        await User.findOneAndUpdate({username: req.user.username},
            {$push: {
                "saved": video
            }});

        res.json({video:"saved"});
        
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})
router.post('/unsave', fetchuser, async (req, res)=>{
    
    try {
        const video = await Video.findOne({filename: req.body.filename});
        await User.findOneAndUpdate({username: req.user.username}, 
            {$pull: {
                "saved": {filename: video.filename}
            }});
        res.json({success: true})

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }

})

router.get('/saved', fetchuser, async(req, res)=>{
    try {

        const user = await User.findOne({username: req.user.username})
        res.json({saved: user.saved});
        
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})

router.post('/comment', fetchuser, async(req, res)=>{
    try {
        
        await Video.findOneAndUpdate({filename: req.body.filename},
            {$push: {
                "comments": {username: req.user.username, comment: req.body.comment}
            }});

        res.json({success: true});
        
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})

router.post('/getcomments', fetchuser, async(req, res)=>{
    try {
        const video = await Video.findOne({filename: req.body.filename})
        res.json({comments: video.comments});
        
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})

router.post('/getpostbyname', async(req, res)=>{
    try {
        const video = await Video.findOne({filename: req.body.filename})
        res.json(video);
        
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})


module.exports = router;