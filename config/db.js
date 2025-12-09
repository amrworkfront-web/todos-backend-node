
const mongoose = require("mongoose");





const  dbConnection=()=>{mongoose.connect(process.env.DB_URI)
.then((connection) => {
    console.log("DB connected successfully");
})
.catch((err) => {
    console.log("DB connection failed", err);
})
}

module.exports=dbConnection;