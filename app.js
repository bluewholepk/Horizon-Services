require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const ObjectId = require('mongodb').ObjectId
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const expressSanitizer = require('express-sanitizer');
const requestIp = require('request-ip');
const moment = require('moment-timezone');
const dateIndia = moment.tz(Date.now(), "Asia/Kolkata")
const formidable = require('formidable');
const path = require('path');
const multer = require('multer');
const nodeMailer = require('nodemailer')

const {
  ensureAuthenticated,
  forwardAuthenticated
} = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', "Login First [Without login you can't access.]");
    res.redirect('/login');
  },
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/home');
  }
};

const app = express();

app.use(express.static("./public/"));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.json());
app.use(expressSanitizer());

// Express body parser
app.use(express.urlencoded({
  extended: true
}));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash

app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.use(methodOverride(function(req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

//MongoDb connection
// mongoose.connect("mongodb+srv://admin-prashant:prashant1601@cluster0.fpopc.mongodb.net/NewHorizonDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false
// })
mongoose.connect("mongodb://localhost:27017/NewHorizonDB", {useNewUrlParser: true,useUnifiedTopology: true,useFindAndModify:false});

//user Schema

const UserSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true
  },
  lname: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: dateIndia
  },
  dob: {
    type: String,
    // required: true
  },

  phone: {
    type: String,
    // required:true
  },
  prof: {
    type: String,
    default: ''
  },
  about: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: 'N/A'
  },
  city: {
    type: String,
    default: 'N/A'
  },
  state: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  work: {
    type: String,
    default: 'N/A'
  },
  experiances: {
    type: String,
    default: 'N/A'
  },
  status: {
    type: String,
    default: 'N/A'
  },
  keyword: {
    type: String,
    default: 'N/A'
  },
  ip: {
    type: String
  },
  stime: {
    type: String,
    default: 'N/A'
  },
  backup: {
    type: String
  },
  userImage: {
    type: String,
    default: 'default.png'
  },
  worktitle: {
    type: String
  },
  workaddress: {
    type: String
  },
  cod: {
    type: String
  },

});

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  date: {
    type: Date,
    default: dateIndia
  }
});

const resetSchema = new mongoose.Schema({
  email: String,
  dob: String,
  date: {
    type: Date,
    default: dateIndia
  }

});


const User = mongoose.model('User', UserSchema);
const Contact = mongoose.model("Contact", contactSchema);
const Reset = mongoose.model("Reset", resetSchema);

passport.use(
  new LocalStrategy({
    usernameField: 'email'
  }, (email, password, done) => {

    // Match user
    User.findOne({
      email: email
    }).then(user => {
      if (!user) {
        return done(null, false, {
          message: 'Sorry! You are not registered. Please! Register & Try Again.'
        });
      }

      // Match password
      bcrypt.compare(password, user.password, (err, isMatch) => {

        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: 'Password incorrect.'
          });
        }
        console.log(user.password)
      });
    });
  })
);


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


app.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));
app.get('/reset', forwardAuthenticated, (req, res) => res.render('reset'));

//home
app.get('/home', ensureAuthenticated, (req, res) =>
  res.render('home', {
    user: req.user
  })

);

// profile
app.get('/profile', ensureAuthenticated, (req, res) =>
  res.render('profile', {
    user: req.user
  })
);


//services
app.get('/services', ensureAuthenticated, (req, res) =>
  res.render('services', {
    user: req.user
  })
);

//place services
app.get('/pservice', ensureAuthenticated, (req, res) =>
  res.render('pservice', {
    user: req.user
  })
);

//team
app.get('/team', ensureAuthenticated, (req, res) =>
  res.render('team', {
    user: req.user
  })
);

//About
app.get('/about', ensureAuthenticated, (req, res) =>
  res.render('about', {
    user: req.user
  })
);

//contact
app.get('/contact', ensureAuthenticated, (req, res) =>
  res.render('contact', {
    user: req.user
  })
);

// Login Page
app.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
app.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register


app.post('/register', (req, res) => {

  let transporter = nodeMailer.createTransport({
    // pool: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    // port: 587,
    // secure: false,
    tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },

    auth: {
      // user: 'contact2horizonservices@gmail.com',
      // pass: '@hs2021@'
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,

    }
  });
  let mailOptions = {
    from: '"Horizon Services" <contact2horizonservices@gmail.com>', // sender address
    to: req.body.email, // list of receivers
    subject: 'Registered successfully', // Subject line
    html: '<h1 align="center">Dear, ' + req.body.fname + ' ' + req.body.lname + '</h1><h2>Your password is : ' + req.body.password + '</h2><br><h4>Thankyou !<br>Team Horizon Services<br></h4><h3><a href="http://new-hori-zone.herokuapp.com/">New Horizon</a></h3>', // html body
    // text: req.body.password, // plain text body
    //   attachments: [
    //   {
    //     // filename: 'logo.jpg',
    //     path: __dirname +'/public/logo.jpg',
    //     cid: 'logo'
    //   }<img src="cid:logo">
    // ],
  };
  // transporter.sendMail(mailOptions, (error, info) => {
  //     if (error) {
  //         return console.log(error);
  //     }
  //     console.log('Message %s sent: %s', info.messageId, info.response);
  //         // res.render('services');
  //         req.flash('success_msg', 'Your order has been placed. worker will contact you soon.');
  //         // req.flash('success', "Your has been placed. worker will contact you soon.");
  //         res.redirect('/services');
  //     });
  // });

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
    // console.log('error is here by prashant');
    // res.render('services');
    // req.flash('success_msg', 'Your order has been placed. worker will contact you soon.');
    // req.flash('success', "Your has been placed. worker will contact you soon.");
    res.redirect('/register');
  });

  // transporter.verify(function (error, success) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log("Server is ready to take our messages");
  //   }
  // });

  const {
    fname,
    lname,
    gender,
    email,
    password,
    backup
  } = req.body;
  const ip = requestIp.getClientIp(req);
  let errors = [];

  if (!fname || !gender || !email || !password || !backup) {
    errors.push({
      msg: 'Please enter all fields.'
    });
  }

  if (password != backup) {
    errors.push({
      msg: 'Passwords do not match.'
    });
  }

  if (password.length < 6) {
    errors.push({
      msg: 'Password must be at least 6 characters.'
    });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      fname,
      lname,
      gender,
      email,
      password,
      backup,
      ip

    });
  } else {
    User.findOne({
      email: email
    }).then(user => {
      if (user) {
        errors.push({
          msg: 'You are already registered. Please login'
        });
        res.render('register', {
          errors,
          fname,
          lname,
          gender,
          email,
          password,
          backup,
          ip

        });
      } else {
        const newUser = new User({
          fname,
          lname,
          gender,
          email,
          password,
          backup,
          ip

        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can login.'
                );
                res.redirect('/login');
              })
              .catch(err => console.log(err));
          });
        });

      }
    });
  }
});

// Login
app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out Successfully ! ');
  res.redirect('/');
});

// SHOW EDIT USER FORM
app.get('/edit/(:id)', ensureAuthenticated, function(req, res, next) {
  var o_id = new ObjectId(req.params.id)
  User.find({
    "_id": o_id
  }, (function(err, result) {
    if (err) return console.log(err)

    // if user not found
    if (!result) {
      req.flash('error', 'User not found with id = ' + req.params.id)
      res.redirect('/profile')
    } else { // if user found
      // render to views/user/edit.ejs template file
      res.render('edit', {
        title: 'Edit User',
        //data: rows[0],
        id: result[0]._id,
        fname: result[0].fname,
        lname: result[0].lname,
        gender: result[0].gender,
        email: result[0].email,
        dob: result[0].dob,
        phone: result[0].phone,
        address: result[0].address,
        city: result[0].city,
        state: result[0].state,
        pincode: result[0].pincode,
        work: result[0].work,
        experiances: result[0].experiances,
        status: result[0].status,
        stime: result[0].stime,
        keyword: result[0].keyword,
        userImage: result[0].userImage,
        prof: result[0].prof,
        about: result[0].about
      })
    }
  }))
})

// EDIT USER POST ACTION
app.put('/edit/(:id)', ensureAuthenticated, function(req, res, next) {

  const o_id = new ObjectId(req.params.id)
  User.updateOne({
    "_id": o_id
  }, {
    $set: {
      fname: req.body.fname,
      lname: req.body.lname,
      gender: req.body.gender,
      email: req.body.email,
      dob: req.body.dob,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      work: req.body.work,
      experiances: req.body.experiances,
      status: req.body.status,
      stime: req.body.stime,
      keyword: req.body.keyword,
      prof: req.body.prof,
      about: req.body.about

    }
  }, function(err, result) {
    if (err) {
      req.flash('error', err)

      res.render('edit', {
        id: req.params.id,
        fname: req.body.fname,
        lname: req.body.lname,
        gender: req.body.gender,
        email: req.body.email,
        dob: req.body.dob,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
        work: req.body.work,
        experiances: req.body.experiances,
        status: req.body.status,
        stime: req.body.stime,
        keyword: req.body.keyword,
        prof: req.body.prof,
        about: req.body.about

      })

    } else {
      req.flash('success_msg', 'Profile updated successfully!')
      res.redirect('/profile');
    }
  });
})



app.get('/search', ensureAuthenticated, (req, res) => {
  try {

    User.find({
        $and: [{
            work: {
              '$regex': req.query.worksearch
            }
          },
          {
            pincode: {
              '$regex': req.query.pinsearch
            }
          },
          {
            address: {
              '$regex': req.query.freesearch
            }
          },
          {
            status: {
              '$regex': "Active"
            }
          }
        ]
      },
      (err, user) => {
        if (err) {
          req.flash('error', ' Worng Input .')
          res.redirect('/services');
          console.log(err);
          console.log('Finding book');
        } else {
          res.render('result', {
            user: user
          })
        }
      })
  } catch (error) {
    console.log(error);
  }
});

app.get("/users/:userId", ensureAuthenticated, function(req, res) {

  const requestedUserId = req.params.userId;

  User.findOne({
    _id: requestedUserId
  }, function(err, user) {
    res.render("post", {
      user: req.user,

      fname: user.fname,
      lname: user.lname,
      email: user.email,
      gender: user.gender,
      phone: user.phone,
      status: user.status,
      work: user.work,
      experiances: user.experiances,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      date: user.date,
      status: user.status,
      stime: user.stime,
      prof: user.prof,
      about: user.about,
      userImage: user.userImage
    })
  })
});

app.post("/contact", ensureAuthenticated, function(req, res) {
  const newContact = new Contact({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    message: req.body.message
  });
  newContact.save(function(err) {
    if (err) {

      console.log("Error is here.");
      console.log(err);

    } else {
      req.flash('success_msg', 'Massege Sent successfully!')
      res.redirect('/contact');
    }
  });
});

app.post("/reset", forwardAuthenticated, function(req, res) {
  const newReset = new Reset({
    email: req.body.email,
    dob: req.body.dob
  });
  newReset.save(function(err) {
    if (err) {
      console.log("Error is here.");
      console.log(err);
    } else {
      req.flash("success_msg", "Request for password Sent successfully! your password will be send within 24 hour's on your Email.please check your Email.Thankyou !")
      res.redirect('/reset')
    }
  });
})

// user profile
app.post('/profileImage', function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req);
  let reqPath = path.join('./public/')
  let newfilename;
  form.on('fileBegin', function(name, file) {
    file.path = reqPath + '/upload/' + req.user.email + file.name;
    newfilename = req.user.email + file.name;
  });
  form.on('file', function(name, file) {
    User.findOneAndUpdate({
        email: req.user.email
      }, {
        'userImage': newfilename
      },
      function(err, result) {
        if (err) {
          req.flash('error_msg', "Profile Pitcute uploading failed.");
          res.redirect('/profile');
          console.log(err);
        }
      });
  });
  req.flash('success_msg', 'Your profile picture has been uploaded');
  res.redirect('/profile');
});



// // Set The Storage Engine
// const storage = multer.diskStorage({
//   destination: './public/uploads/',
//   filename: function(req, file, cb){
//     cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   }
// });
//
// // Init Upload
// const upload = multer({
//   storage: storage,
//   limits:{fileSize: 1000000},
//   fileFilter: function(req, file, cb){
//     checkFileType(file, cb);
//   }
// }).single('myImage');
//
// // Check File Type
// function checkFileType(file, cb){
//   // Allowed ext
//   const filetypes = /jpeg|jpg|png|gif/;
//   // Check ext
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   // Check mime
//   const mimetype = filetypes.test(file.mimetype);
//
//   if(mimetype && extname){
//     return cb(null,true);
//   } else {
//     cb('Error: Images Only!');
//   }
// }

// app.post('/upload', (req, res) => {
//   upload(req, res, (err) => {
//     if(err){
//       res.render('profile', {
//         msg: err
//       });
//     } else {
//       if(req.file == undefined){
//         res.render('index', {
//           msg: 'Error: No File Selected!'
//         });
//       } else {
//         res.render('profile', {
//           msg: 'File Uploaded!',
//           file: `uploads/${req.file.filename}`
//         });
//       }
//     }
//   });
// });

//************************************************************************ADMIN FIELDS**************************************************************

//admin home
app.get("/admin-home", ensureAuthenticated, function(req, res) {
  User.find({}, function(err, user) {
    res.render("admin-home", {
      user: user,
    });
  });
});

//admin password resend
app.get("/password-request", function(req, res) {
  Reset.find({}, function(err, reset) {
    res.render("password-requests", {
      reset: reset,
    });
  });
});

//admin msg seen
app.get("/message", function(req, res) {
  Contact.find({}, function(err, contact) {
    res.render("messages", {
      contact: contact,
    });
  });
});

//amin search
app.get('/admin-search', ensureAuthenticated, (req, res) => {

  try {
    User.find({
      $or: [{
        email: {
          '$regex': req.query.adminsearch
        }
      }, {
        work: {
          '$regex': req.query.adminsearch
        }
      }]
    }, (err, user) => {
      if (err) {
        req.flash('error', ' Worng Input .')
        res.redirect('/admin-home');
        console.log(err);
        console.log('Finding book');
      } else {
        req.flash('success_msg', "Reasult ('s)")
        res.render('admin-home', {
          user: user
        });
      }
    })
  } catch (error) {
    console.log(error);
  }
});

//admin user profile update show
app.get("/admin/userprofile/:userId", ensureAuthenticated, function(req, res) {

  const requestedUserId = req.params.userId;

  User.findOne({
    _id: requestedUserId
  }, function(err, user) {
    res.render("admin-user-profile", {
      user: req.user,

      fname: user.fname,
      lname: user.lname,
      email: user.email,
      gender: user.gender,
      phone: user.phone,
      status: user.status,
      work: user.work,
      experiances: user.experiances,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      date: user.date,
      status: user.status,
      stime: user.stime,
      prof: user.prof,
      about: user.about,
      userImage: user.userImage,
      backup: user.backup

    });
  });

});

//admin user profile update now
app.get('/admin/update/(:id)', ensureAuthenticated, function(req, res, next) {
  var o_id = new ObjectId(req.params.id)
  User.find({
    "_id": o_id
  }, (function(err, result) {
    if (err) return console.log(err)

    // if user not found
    if (!result) {
      req.flash('error', 'User not found with id = ' + req.params.id)
      res.redirect('/admin-home')
    } else { // if user found
      // render to views/user/edit.ejs template file
      res.render('admin-user-profile-update', {
        title: 'Edit User',
        //data: rows[0],
        id: result[0]._id,
        fname: result[0].fname,
        lname: result[0].lname,
        gender: result[0].gender,
        email: result[0].email,
        dob: result[0].dob,
        phone: result[0].phone,
        address: result[0].address,
        city: result[0].city,
        state: result[0].state,
        pincode: result[0].pincode,
        work: result[0].work,
        experiances: result[0].experiances,
        status: result[0].status,
        stime: result[0].stime,
        keyword: result[0].keyword,
        userImage: result[0].userImage,
        prof: result[0].prof,
        about: result[0].about
      })
    }
  }))
})

// EDIT USER POST ACTION
app.put('/admin/update/(:id)', ensureAuthenticated, function(req, res, next) {

  const o_id = new ObjectId(req.params.id)
  User.updateOne({
    "_id": o_id
  }, {
    $set: {
      fname: req.body.fname,
      lname: req.body.lname,
      gender: req.body.gender,
      email: req.body.email,
      dob: req.body.dob,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      work: req.body.work,
      experiances: req.body.experiances,
      status: req.body.status,
      stime: req.body.stime,
      keyword: req.body.keyword,
      prof: req.body.prof,
      about: req.body.about

    }
  }, function(err, result) {
    if (err) {
      req.flash('error', err)

      res.render('admin-user-profile-update', {
        id: req.params.id,
        fname: req.body.fname,
        lname: req.body.lname,
        gender: req.body.gender,
        email: req.body.email,
        dob: req.body.dob,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
        work: req.body.work,
        experiances: req.body.experiances,
        status: req.body.status,
        stime: req.body.stime,
        keyword: req.body.keyword,
        prof: req.body.prof,
        about: req.body.about
      })
    } else {
      req.flash('success_msg', 'Profile updated successfully!')
      res.redirect('/profile')
    }
  });
})

// admin user profile
app.post('/admin/profileImage', function(req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req);
  let reqPath = path.join('./public/')
  let newfilename;
  form.on('fileBegin', function(name, file) {
    file.path = reqPath + '/upload/' + req.user.email + file.name;
    newfilename = req.user.email + file.name;
  });
  form.on('file', function(name, file) {
    User.findOneAndUpdate({
        email: req.user.email
      }, {
        'userImage': newfilename
      },
      function(err, result) {
        if (err) {
          req.flash('error_msg', "User Profile Picture uploading failed.");
          res.redirect('/admin-home');
          console.log(err);
        }
      });
  });
  req.flash('success_msg', 'User profile picture has been uploaded');
  res.redirect('/admin-home');
});



// DELETE USER
app.delete('/admin/delete/(:id)', ensureAuthenticated, function(req, res, next) {
  var o_id = new ObjectId(req.params.id)
  User.deleteOne({
    "_id": o_id
  }, function(err, result) {
    if (err) {
      req.flash('error', err)
      // redirect to users list page
      res.redirect('/admin-home')
    } else {
      req.flash('success', 'User deleted successfully! id = ' + req.params.id)
      // redirect to users list page
      res.redirect('/admin-home')
    }
  })
})



// app.post('/notification', function(req, res) {
// 	var form =new formidable.IncomingForm();
// 	form.parse(req);
// 	let reqPath= path.join(__dirname, '../');
// 	let newfilename;
// 	form.on('fileBegin', function(name, file){
// 		file.path = reqPath+ 'public/upload/'+ req.user.username + file.name;
// 		newfilename= req.user.username+ file.name;
// 	});
// 	form.on('file', function(name, file) {
// 		User.findOneAndUpdate({
// 			username: req.user.username
// 		},
// 		{
// 			'userImage': newfilename
// 		},
// 		function(err, result){
// 			if(err) {
// 				console.log(err);
// 			}
// 		});
// 	});
// 	req.flash('success_msg', 'Your profile picture has been uploaded');
// 	res.redirect('/');
// });
//
// function ensureAuthenticated(req, res, next){
// 	if(req.isAuthenticated()){
// 		return next();
// 	} else {
// 		//req.flash('error_msg','You are not logged in');
// 		res.redirect('/users/login');
// 	}
// }
app.get('/send-email', ensureAuthenticated, (req, res) =>
  res.render('sendmail', {
    user: req.user
  })
);


app.post('/send-email', function(req, res) {
  let transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD
      // user: 'contact2horizonservices@gmail.com',
      // pass: '@hs2021@'
    }
  });
  let mailOptions = {
    from: '"Horizon Services" <contact2horizonservices@gmail.com>', // sender address
    to: req.body.to, // list of receivers
    cc: req.body.cc,
    subject: req.body.subject, // Subject line
    // text: req.body.body, // plain text body
    html: '<center><h2>Heir Name : <i> Mr./Ms. '+req.body.fname+' '+req.body.lname+'</i></h2> <br>__________________________________________<br><h2>Address</h2><br>Address : ' + req.body.address + ', City : ' + req.body.city + ', State : ' + req.body.state + '<br>Contact number : ' + req.body.mobile + '<br>Pin Code : ' + req.body.pincode + ' </center>',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
    // res.render('services');
    req.flash('success_msg', 'Your order has been placed. worker will contact you soon.');
    // req.flash('success', "Your has been placed. worker will contact you soon.");
    res.redirect('/services');
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("server has started on port localhost:3000.");
});
