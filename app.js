//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/user_DB",{useNewUrlParser:true ,useUnifiedTopology: true});

//creating a mongoose schema for collection
const userSchema=new mongoose.Schema({
  email:String,
  password:String
});

//whenever we call save method it will encrypt and whenever we call fins it will decrypt
userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});

const User = new mongoose.model("User",userSchema);


app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  const email=req.body.username;
  const password =req.body.password;
  const user=new User({
    email:email,
    password:password
  });
  user.save(function(err){
    if(!err){
      res.render("secrets");
    }
  });
});

app.post("/login",function(req,res){
  const username=req.body.username;
  const password=req.body.password;
  User.findOne({email:username},function(err,user){
    if(!err){
      if(password===user.password){
        res.render("secrets");
      }
      else{
        console.log("invalid user");
      }
    }
  })
})
app.listen(3000,function(){
  console.log("server started succesfully");
})
