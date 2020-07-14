//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport =require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

const GoogleStrategy = require('passport-google-oauth20').Strategy;
//iniitalizing passport for our session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/user_DB",{useNewUrlParser:true ,useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
//creating a mongoose schema for collection
const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:String
});



//whenever we call save method it will encrypt and whenever we call fins it will decrypt
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
//creates a cookkie which stores user info
//crumbles the cokkie and allows the passport to read the cookiee.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//defining the google stratergy we provide  our credentials so that google can recognize our app
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",//the route to be redirected after successful auth
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//after google performs authentication ,then it redirects to this route
app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/",function(req,res){
  res.render("home");
});

//use passport to authenticate using the google strategy defined above and then we tell what we want i.e the users profile that includes useremail and id
app.get("/auth/google",passport.authenticate("google",{scope:['profile']}));

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/submit",function(req,res){
  //if the user is already logged in then retuens true else false
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.redirect("/login");
  }
});

//passport stores the details of current logged in user
app.post("/submit",function(req,res){
  const  submittedsecret=req.body.secret;
  console.log(req.user.id);
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret=submittedsecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

//refer documentation of  passport local mongoose on npmjs
//the register method will create a document of the collection user and interact with the database
app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  User.find({"secret":{$ne:null}},function(err,foundusers){
    if(err){
      console.log(err);
    }else{
      if(foundusers){
        res.render("secrets",{usersWithSecrets:foundusers});
      }
    }
  })
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
