//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport =require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

//iniitalizing passport for our session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/user_DB",{useNewUrlParser:true ,useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
//creating a mongoose schema for collection
const userSchema=new mongoose.Schema({
  email:String,
  password:String
});



//whenever we call save method it will encrypt and whenever we call fins it will decrypt
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
//creates a cookkie which stores user info
passport.serializeUser(User.serializeUser());
//crumbles the cokkie and allows the passport to read the cookiee.
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/secrets",function(req,res){
  //if the user is already logged in then retuens true else false
  if(req.isAuthenticated()){
    res.render("secrets");
  }
  else{
    res.redirect("/login");
  }
});

//refer documentation of  passport local mongoose on npmjs
//the register method will create a document of the collection user and interact with the database
app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      //the callback function is onlyy triggerd when the authentication is successfull
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login",function(req,res){

  const user=new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      })
    }
  })
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})


app.listen(3000,function(){
  console.log("server started succesfully");
})
