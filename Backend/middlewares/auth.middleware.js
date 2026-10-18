const userModel = require('../models/user.model')
const blacklistTokenModel = require('../models/blacklisttoken.model')
const jwt = require("jsonwebtoken")
const bcrypt = require ("bcrypt")
const captainModel = require('../models/captain.model')
module.exports.authUser = async (req , res , next) => {

    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

    if(!token) {
        return res.status(401).json({message : "unauthorized"})
    }

    const isBlacklisted = await blacklistTokenModel.findOne({token})
    if(isBlacklisted) {
        return res.status(401).json({message : "unauthorized"})
    }

    let decoded
    try {
        decoded = jwt.verify(token , process.env.JWT_SECRET)
    }catch(arr) {
        return res.status(401).json({message : "unauthorized"})
    }

    const user = await userModel.findById(decoded._id)
    if(!user) {
        return res.status(401).json({message : "unauthorized"})
    }

    req.user = user
    req.authToken = token
    return next()
}

module.exports.authCaptain = async (req , res , next) => {
  
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1]

    if(!token) {
        return res.status(401).json({message : "unauthorized"})
    }

    const isBlacklisted = await blacklistTokenModel.findOne({token})
    if(isBlacklisted) {
        return res.status(401).json({message : "unauthorized"})
    }

    let decoded
    try {
     const decoded = jwt.verify(token , process.env.JWT_SECRET)
        
    const captain = await captainModel.findById(decoded._id)
        req.captain = captain
         return next()
    }catch(arr) {
        return res.status(401).json({message : "unauthorized"})
    }
}