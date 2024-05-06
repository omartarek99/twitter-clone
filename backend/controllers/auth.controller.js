import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
    try {
        const { username, fullName, email, password } = req.body;

        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Invalid email format"
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                error: "Username already exists"
            });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                error: "Email already taken"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        generateTokenAndSetCookie(newUser._id, res);

        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            username: newUser.username,
            email: newUser.email,
            followers: newUser.followers,
            following: newUser.following,
            profileImg: newUser.profileImg,
        });
    } catch (error) {
        console.log("error in the signup controller:", error);
        res.status(500).json({ error: error.message });
    }
};


export const login = async (req, res) => {
    res.json({
        data: "you hit the login endpoint!",
});

}


export const logout = async (req, res) => {
    res.json({
        data: "you hit the logout endpoint!",
});

}