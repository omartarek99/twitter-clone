import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (userId,res)   => {

    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '15d'
    })
    res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 15,
        sameSite: "strict",
        secure: process.env.NODE_ENV!== 'development',
    });
};