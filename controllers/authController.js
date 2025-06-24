const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const secret = process.env.JWT_SECRET;

dotenv.config();

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    let user = await User.findOne({email});

    if (user) {
        return res.status(400).send("Email is already registered");
    }
    
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {

        let createdUser = await User.create({
            name,
            email,
            password: hash
        });

        let token = jwt.sign({email}, secret);
        res.cookie("token", token); // Set the token as a cookie
        res.redirect('/dashboard');
        });
    });
}

exports.login = async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({email});

    if (!user) {
        return res.status(400).send("Email or password is incorrect");
    }
    else{
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                let token = jwt.sign({ userId: user._id }, secret);
                res.cookie("token", token); // Set the token as a cookie
                res.redirect('/dashboard');
            } else {
                return res.status(400).send("Email or password is incorrect");
            }
        });
    }
};