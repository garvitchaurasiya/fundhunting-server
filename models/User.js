const mongoose = require('mongoose');
const {Schema} = mongoose;
const UserSchema = new Schema({
    
    username: {
        type: String,
        required: true,
        unique: true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobileNumber:{
        type: String,
    },
    password:{
        type:String,
        required:true
    },
    saved: {
        type: Array
    },
    posts: {
        type: Array
    },
    placedBids: {
        type: Array
    },
    date:{
        type:Date,
        default:Date.now
    }
    
})

const User = mongoose.model('user', UserSchema);
// User.createIndexes();
module.exports = User;