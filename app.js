var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose')
var session = require('express-session');
var MongoStore = require('connect-mongo');

var authRouter = require('./routes/auth.routes');
var forumRouter = require('./routes/forum.routes');
var commentRouter = require('./routes/comments.routes');
var authorizationRouter = require('./routes/authorization.routes');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.set('trust proxy', 1);
app.enable('trust proxy');

app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24400000 
    }, 
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI
    })
  })
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/auth', authRouter);
app.use('/forum', forumRouter);
app.use('/comments', commentRouter);
app.use('/authorization', authorizationRouter);
app.use(function(req, res, next) {
  next(createError(404));
});


app.use(function(err, req, res, next) {
  
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then((connection) =>
    console.log("connected to " + connection.connection.name)
  )
  .catch((err) => console.log(err));


module.exports = app;
