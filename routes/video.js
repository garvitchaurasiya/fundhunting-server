const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video')
const multer  = require('multer')
const fetchuser = require('../middleware/fetchuser');


//
const crypto = require('crypto');
const mongoose = require('mongoose');
// const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const path = require("path");
//


// Route 1: 


//
const mongoURI = "mongodb+srv://garvit:20020725@cluster0.nhpd38n.mongodb.net/?retryWrites=true&w=majority";

// Create Mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs, gridfsBucket;
conn.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });

    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})

// Create storage engine

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*')

    await User.updateOne({ username: req.body.username }, { $push: { "posts": req.file.filename } });

    await Video.create({
        filename: req.file.filename,
        author: req.body.username,
        amount: req.body.amount,
        equity: req.body.equity
    })

    console.log(req.file);
    res.json({ success: true, file: req.file });
})
//


router.get('/load/:filename', (req, res) => {

    try {
        gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
            if (!file || file.length === 0) {
                return res.status(404).json({
                    err: 'No file exists'
                })
            }
    
            const range = req.headers.range;
            if (!range) {
                res.status(400).send("Requires Range header");
            }
    
            const videoSize = file.length;
            const start = Number(range.replace(/\D/g, ""));
            const end = videoSize - 1;
    
            // const CHUCK_SIZE = 10**7;
            // const videoSize = file.length;
            // const start = Number(range.replace(/\D/g, ""));
            // const end = Math.min(start + CHUCK_SIZE, videoSize - 1);
            const contentLength = end - start;
    
            console.log(start, end, contentLength, `bytes ${start}-${end}/${videoSize}`);
    
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4"
            }
    
            if (contentLength == 0) {
                return res.status(200).send("Done");
            }
            res.writeHead(206, headers);
    
            const downloadStream = gridfsBucket.openDownloadStreamByName(file.filename, {
                start: start,
                end: end
            })
            downloadStream.pipe(res);
    
        })
    } catch (error) {
        console.log(error.message);
        return res.json(500).send(error.message);
    }

    
})


// var storage = multer.diskStorage({
//     destination: function(req, file, cb){
//         cb(null, './public/uploads')
//     },
//     filename: function(req, file, cb){
//         cb(null, `${Date.now()}_${file.originalname}` )
//     },
//     fileFilter: (req, file, cb) => {
//         const extention = path.extname(file.originalname);
//         if(extention !== ".mp4"){
//             return cb(res.status(400).end('Only mp4 file is allowed'), false);
//         }
//     }
// })

// var upload = multer({ storage });

// router.post('/upload', upload.single('file') ,async (req, res)=>{
//     // upload(req, res, err => {
//     //     if(err){
//     //         console.log(err);
//     //         return res.json({a: false, err});
//     //     }
//     //     return res.json({success: true, filePath: res.req.file.path, fileName: req.req.file.filename})
//     // })
//     res.setHeader('Access-Control-Allow-Origin', '*') 

//     await User.updateOne({username: req.body.username}, { $push: { "posts": req.file.filename } } );

//     await Video.create({
//         filename: req.file.filename,
//         author: req.body.username,
//         amount: req.body.amount,
//         equity: req.body.equity
//     })

//     console.log(req.file);
//     res.json({success:true, file: req.file});
// })

router.post('/like', fetchuser, async (req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
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
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
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
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
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
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
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
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
    let videos = await Video.find();
    res.json(videos);

})

router.post('/getuservideos', async (req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
    let videos = await Video.find({author: req.body.username});
    res.json(videos);

})

router.post('/placebid',fetchuser, async(req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
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
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
    try {

        const video = await Video.findOne({filename: req.body.filename});
        res.json({bids: video.bids});

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }

})

router.post('/alreadysaved', fetchuser, async (req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
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
    res.setHeader('Access-Control-Allow-Origin', '*') 

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
    res.setHeader('Access-Control-Allow-Origin', '*') 
    
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
    res.setHeader('Access-Control-Allow-Origin', '*') 

    try {

        const user = await User.findOne({username: req.user.username})
        res.json({saved: user.saved});
        
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})

router.post('/comment', fetchuser, async(req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*') 

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
    res.setHeader('Access-Control-Allow-Origin', '*') 

    try {
        const video = await Video.findOne({filename: req.body.filename})
        res.json({comments: video.comments});
        
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})

router.post('/getpostbyname', async(req, res)=>{
    res.setHeader('Access-Control-Allow-Origin', '*') 

    try {
        const video = await Video.findOne({filename: req.body.filename})
        res.json(video);
        
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({success: false, error: "Internal Server Error"});
    }
})


module.exports = router;