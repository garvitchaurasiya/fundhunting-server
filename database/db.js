const mongoose = require('mongoose');

// const mongoDB_URI = "mongodb+srv://igarvit:garvit1146@cluster0.vledw.mongodb.net/northflex?retryWrites=true&w=majority";
const mongoDB_URI = "mongodb+srv://garvit:20020725@cluster0.nhpd38n.mongodb.net/?retryWrites=true&w=majority";
// const mongoDB_URI = "mongodb://localhost:27017/fundhunting";

const connectToMongoDB = ()=>{
    mongoose.connect(mongoDB_URI, ()=>{
        console.log("Connected to MongoDB successfully");
    })
}

module.exports= connectToMongoDB;