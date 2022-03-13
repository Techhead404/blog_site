const express = require('express');
const morgan = require('morgan')
const mongoose = require('mongoose');
const Blog = require('./models/blog');
const USER = require('./models/blog');
const { result } = require('lodash');
const { redirect, render } = require('express/lib/response');
const dotenv = require('dotenv');

const bcrypt = require('bcrypt')

const app = express();

dotenv.config();

mongoose.connect(process.env.DB_CONNECT)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err))

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true}));
//app.use(morgan('dev'));
//////////////////////////////////////////
const { auth, requiresAuth } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENTID,
  issuerBaseURL: process.env.ISSUER_BASE_URL
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/login', (req, res) => {
   res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
 });
//////////////////////////////////////////

app.get('/',(req, res) => {
    res.render('index',{title:'Home'});
});

app.get('/about',(req, res) => {
    res.render('about',{title:'About'});
});

app.get('/blogs/create',requiresAuth() ,(req, res) => {
    //res.send(JSON.stringify(req.oidc.user))
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

app.delete('/blogs/:id',requiresAuth(), (req, res)=>{
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


  
