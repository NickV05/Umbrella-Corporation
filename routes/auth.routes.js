const {Router} = require('express')
const mongoose = require('mongoose')
const User = require("../models/User.model")
const bcrypt = require("bcryptjs")
const router = new Router()
const fileUploader = require('../middleware/cloudinary')
const salt = 12;
const { isLoggedIn, isLoggedOut } = require('../middleware/route-guard.js');

router.get("/signup",isLoggedOut, (req,res) => {
    res.render('auth/signup.hbs')
})


router.post("/signup", (req, res, next) => {
    const { username, fullName, password } = req.body;
  
    if (!username|| !password|| !fullName) {
        res.render('auth/signup', { errorMessage: 'All fields are mandatory. Please provide your username, full name and password.' });
        return;
      }
      const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res
      .status(500)
      .render('auth/signup', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' });
    return;
  }

    bcrypt
      .genSalt(salt)
      .then((salts) => {
        return bcrypt.hash(password, salts);
      })
      .then((hashedPass) =>
        User.create({ username, fullName, passwordHash: hashedPass }).then(
          (createdUser) => {
            req.session.user = createdUser;
            res.redirect(`/auth/userProfile/${createdUser._id}`)}
        )
      )
      .catch(error => {
        if (error instanceof mongoose.Error.ValidationError) {
          res.status(500).render('auth/signup', { errorMessage: error.message });
        } else if (error.code === 11000) {
   
          res.status(500).render('auth/signup', {
             errorMessage: 'Username already exists.'
          });
        } else {
          console.log(error);
          next(error);
        }
      });
  });


router.get('/login', (req,res,next) => {
  res.render('auth/login.hbs')
})

router.post('/login', (req, res, next) => {
  const { username, password } = req.body;
 
  if (username === '' || password === '') {
    res.render('auth/login', {
      errorMessage: 'Please enter both, username and password to login.'
    });
    return;
  }
 
  User.findOne({ username })
    .then(user => {
      if (!user) {
        res.render('auth/login', { errorMessage: 'User not found and/or incorrect password.' });
        return;
      } else if (bcrypt.compareSync(password, user.passwordHash)) {
  
        req.session.user = user;
        res.render("index",{user})
      } else {
        res.render('auth/login', { errorMessage: 'User not found and/or incorrect password.' });
      }
    })
    .catch(error => next(error));
});

router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) next(err);
    res.redirect('/auth/login');
  });
});

router.get("/userProfile/:userID", isLoggedIn, (req, res) => {


User.findById(req.params.userID)
  .populate('discussions')
  .populate('reviews')
  .then((foundUser) => {
    if(!foundUser.avatar){
      foundUser.avatar = 'https://res.cloudinary.com/dyto7dlgt/image/upload/v1689954676/project-2/fu0iymmcwhd6xofoftos.png'
    }
    const registered = new Date(`${foundUser.createdAt}`).toLocaleDateString();
    const myProfile = req.session.user._id == foundUser._id.toString();
    res.render('users/user-profile.hbs', {foundUser, registered, myProfile, user:req.session.user});
  })
  .catch((err) => {
    console.log(err)
    next(err)
  })

});

router.post("/userProfile/:userID", fileUploader.single('avatar'), isLoggedIn, (req, res) => {
  const { fullName, avatar, username} = req.body

  if(!req.file){
    User.findByIdAndUpdate(
      req.params.userID,
        {
            fullName,
            username,
            avatar: req.session.user.avatar
        }, 
        {new: true}
    )
    .then((updatedUser) => {
      req.session.user = updatedUser
      res.redirect(`/auth/userProfile/${updatedUser._id}`);
    })
    .catch((err) => {
      console.log(err)
        next(err)
    })
  }
  else{
    User.findByIdAndUpdate(
      req.params.userID,
        {
            fullName,
            avatar: req.file.path,
            username
        },
        {new: true}
    )
    .then((updatedUser) => {
      req.session.user = updatedUser
      res.redirect(`/auth/userProfile/${updatedUser._id}`);
    })
    .catch((err) => {
        console.log(err)
        next(err)
    })
  }
  });

module.exports = router;