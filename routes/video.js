const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video')
const multer = require('multer')
const fetchuser = require('../middleware/fetchuser');
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const upload = multer({});
router.post('/upload', upload.single('file'), async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        const client = new S3Client({
            credentials: {
                accessKeyId: process.env.ACCESS_KEY,
                secretAccessKey: process.env.SECRET_ACCESS_KEY
            },
            region: 'ap-south-1'
        });
        const Filename = `${Date.now()}-${req.file.originalname}`;
        const command = new PutObjectCommand({
            Bucket: 'fundhunting-s3-bucket',
            Key: Filename,
            Body: req.file.buffer,
            ContentType: 'video/mp4'
        });
        const response = await client.send(command);
        res.send(response);

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})



router.post('/like', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    try {
        const { filename } = req.body;
        await Video.findOneAndUpdate({ filename: filename },
            {
                $push: {
                    "likes": { username: req.user.username }
                }
            });
        const video = await Video.findOne({ filename });
        res.json({ likes: video.likes });

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})

router.post('/dislike', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    try {
        const { filename } = req.body;
        await Video.findOneAndUpdate({ filename: filename },
            {
                $pull: {
                    "likes": { username: req.user.username }
                }
            });
        const video = await Video.findOne({ filename });
        res.json({ likes: video.likes });

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }

})


router.post('/alreadyliked', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    try {
        const { filename } = req.body;
        const isLiked = await Video.findOne({ filename: filename, likes: { username: req.user.username } })
        res.json({ isLiked });

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }

})

router.post('/getlikes', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        const { filename } = req.body;

        const video = await Video.findOne({ filename });

        res.json({ totalLikes: video.likes.length });

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})

router.get('/getvideos', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        let videos = await Video.find();
        res.json(videos);
    } catch (error) {
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})

router.post('/getuservideos', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        let videos = await Video.find({ author: req.body.username });
        res.json(videos);
    } catch (error) {
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }

})

router.post('/placebid', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        const { filename, bidamount, bidequity } = req.body;
        const bidplacer = req.user.name;
        await Video.findOneAndUpdate({ filename: filename },
            {
                $push: {
                    "bids": { amount: bidamount, equity: bidequity, bidplacer }
                }
            });
        const video = await Video.findOne({ filename });
        res.json({ bids: video.bids })

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }

})

router.post('/getbids', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        const video = await Video.findOne({ filename: req.body.filename });
        res.json({ bids: video.bids });

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }

})

router.post('/alreadysaved', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        const isSaved = await User.findOne({ username: req.user.username })
        for (var i = 0; i < isSaved.saved.length; i++) {
            if (isSaved.saved[i].filename === req.body.filename) {
                return res.json({ saved: true })
            }
        }
        res.json({ saved: false });
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }

})

router.post('/save', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        const video = await Video.findOne({ filename: req.body.filename });
        await User.findOneAndUpdate({ username: req.user.username },
            {
                $push: {
                    "saved": video
                }
            });
        res.json({ video: "saved" });
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})
router.post('/unsave', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    try {
        const video = await Video.findOne({ filename: req.body.filename });
        await User.findOneAndUpdate({ username: req.user.username },
            {
                $pull: {
                    "saved": { filename: video.filename }
                }
            });
        res.json({ success: true })

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }

})

router.get('/saved', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    try {
        const user = await User.findOne({ username: req.user.username })
        res.json({ saved: user.saved });
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})

router.post('/comment', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    try {
        await Video.findOneAndUpdate({ filename: req.body.filename },
            {
                $push: {
                    "comments": { username: req.user.username, comment: req.body.comment }
                }
            });
        res.json({ success: true });

    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})

router.post('/getcomments', fetchuser, async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        const video = await Video.findOne({ filename: req.body.filename })
        res.json({ comments: video.comments });
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})

router.post('/getpostbyname', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
        const video = await Video.findOne({ filename: req.body.filename })
        res.json(video);
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, error: "Internal Server Error" });
    }
})


module.exports = router;