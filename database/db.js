const mongoose = require('mongoose');

const connectToMongoDB = ()=>{
    mongoose.connect(process.env.MONGODB_URI, ()=>{
        console.log("Connected to MongoDB successfully");
    })
}

module.exports= connectToMongoDB;