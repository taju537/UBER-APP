const mongoose = require ('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1'])

async function connectDB () {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("database connected successfully ");
        
         
    }catch  (err) {
        console.log("Database connection error ", err);
        
        
    }
}

module.exports =connectDB