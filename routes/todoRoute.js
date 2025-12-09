const express=require('express')
const route=express.Router()
const toDo=require("../models/todo")





route.post('',(req,res)=>{

    const {title,description,status}=req.body
    const newtodo=  new toDo({title,description,status})
    newtodo.save()
    res.send('to do added successfully')
})

route.get('',async(req,res)=>
{
    const todos=await toDo.find()
    res.json(todos)
})

route.get('/:id',async(req,res)=>
{
    const {id}=req.params

    const todos=await toDo.findById(id)
    res.json(todos)
})

route.delete('/:id',async(req,res)=>
{
    const {id}=req.params

    const todos=await toDo.findByIdAndDelete(id)
    if(!todos)
      return  res.send("this task is no exist")
    res.send("delete task are successfully")
})


route.put('/:id',async(req,res)=>
{
    const {id}=req.params
    const {title,description}=req.body
    const todos=await toDo.findByIdAndUpdate(id,{title,description},{new:true})
    if(!todos)
      return  res.send("this task is no exist")
    res.send("updated task are successfully").json(todos)
})



module.exports = route;