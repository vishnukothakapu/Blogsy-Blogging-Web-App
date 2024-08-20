const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type:String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique:true,
    },
    googleId: {
        type:String,
    },
    githubId: {
        type:String,
    },
    image: {
        type: String,
        required:true,
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Blog",
        },
    ],
},
    { timestamps: true })
userSchema.plugin(passportLocalMongoose)
const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;