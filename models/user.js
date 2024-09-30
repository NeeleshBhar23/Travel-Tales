const mongoose = require('mongoose');

mongoose.connect(`mongodb://localhost:27017/Traveltale`);

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    address: String,
    email: String,
    password: String,
    profilepic: {
          type: String,
          default: "default.png"
    },
    posts:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }],
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }]
});

module.exports = mongoose.model("user", userSchema);