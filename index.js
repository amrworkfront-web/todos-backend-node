const express=require("express")
const cors=require('cors')
const dotenv=require('dotenv')
const dbConnection=require('./config/db')
const todoRoute =require('./routes/todoRoute')
const userRoute =require('./routes/registerRoute')
dotenv.config()
PORT=process.env.PORT||3000
dbConnection()
app=express()
app.use(cors())
app.use(express.json());

app.use('/tasks',todoRoute)
app.use('/register',userRoute)
app.listen(PORT,()=>{
    console.log(`server are running on port ${PORT}`)
})

