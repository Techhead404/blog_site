const express = require('express');
const morgan = require('morgan')
const mongoose = require('mongoose');
const Blog = require('./models/blog');
const USER = require('./models/blog');
const { result } = require('lodash');
const { redirect, render } = require('express/lib/response');
const dotenv = require('dotenv');
/////////////////
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
/////////////////

const app = express();

dotenv.config();

mongoose.connect(process.env.DB_CONNECT)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err))

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true}));
app.use(morgan('dev'));
/////////////////////////////////////////////////////////
const users = USER

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)


app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    } 
    res.redirect('/login')
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/views/create.ejs')
    }
    next()
  }

  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login')
  })
  
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/blogs/create',
    failureRedirect: '/login',
    failureFlash: true
  }))
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register')
  })
  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new USER({
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword
      });
      try{
          const savedUser = await user.save();
          res.redirect('/login')
      }catch (err){
          res.status(400).send(err)
      }
    });
///////////////////////////////////////////////////////////

app.get('/',(req, res) => {
    res.render('index',{title:'Home'});
});2

app.get('/about',(req, res) => {
    res.render('about',{title:'About'});
});

app.get('/blogs/create',checkAuthenticated,(req, res) => {
    res.render('create',{title:'Create'});
});



app.get('/blogs', (req,res) => {
    Blog.find().sort({ createdAt: -1})
        .then((result) =>{
            res.render('blogs', { blogs: result, title: 'All blogs' })
        })
        .catch((err)=>{
            console.log(err)
        })  
});

app.post('/blogs', (req, res) =>{
    const blog = new Blog(req.body)

    blog.save()
    .then((result) =>{
        res.redirect('/blogs');
    })
    .catch((err) =>{
        console.log(err);
    });
});

app.get('/blogs/:id', (req,res) => {
    const id = req.params.id
    Blog.findById(id)
    .then(result => {
        res.render('details', {blog: result, title: "Blog Details"});
    })
    .catch(err => {
        console.log(err)
    })
});

app.delete('/blogs/:id', (req, res)=>{
    const id = req.params.id;
    Blog.findByIdAndDelete(id)
        .then(result => {
            res.json({ redirect: '/blogs'});
        })
        .catch(err => {
            console.log(err);
        });
});

app.use((req, res) => {
    res.status(404).render('404', {title:'404'});
});
  
