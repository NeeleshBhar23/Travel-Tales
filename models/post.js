const mongoose = require('mongoose');


const postSchema = mongoose.Schema({
   
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    date: {
        type: Date,
        default: Date.now
    },
    heading: String,
    content: String,
    postpic: {
        type: String,
        default: "default.png"
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    hashtags : [String]
   
});

module.exports = mongoose.model("post", postSchema);