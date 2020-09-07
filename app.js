const express = require("express"),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  passportLocal = require("passport-local"),
  expressSession = require("express-session"),
  seedDB = require("./seeds.js"),
  Campground = require("./models/campground.js"),
  User = require("./models/user.js"),
  Comment = require("./models/comment.js")
app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"))

//initialize the database
//with some initial data
seedDB();


//PASSPORT CONFIGURATION
app.use(expressSession({
  secret: "yeah, you know what, it's me!",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});


app.get("/", (req, res) => {
  res.redirect("/campgrounds")
});

//INDEX - show all campgrounds
app.get("/campgrounds", (req, res) => {
  //get campground from DB
  Campground.find({}, (err, allFoundCampgrounds) => {
    if (err) {
      console.log(err);
    } else {
      res.render("campgrounds/index.ejs", { campgrounds: allFoundCampgrounds });
    }
  });
});

//NEW - show form to create new campground
app.get("/campgrounds/new", isLoggedIn, (req, res) => {
  res.render("campgrounds/new.ejs");
});


//CREATE - add new campgrounds to DB
app.post("/campgrounds", isLoggedIn, (req, res) => {
  //create new campground from the form
  const newCampground = req.body.campground;
  //save campground to DB
  Campground.create(newCampground, (err, foundCampground) => {
    if (err) {
      console.log(err);
    } else {
      //redirect back to the campgrounds page
      res.redirect("/campgrounds");
    }
  });
});

//SHOW - show campground info about one campground
app.get("/campgrounds/:id", (req, res) => {
  //find the campground with provided ID
  Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
    if (err) {
      console.log(err);
    } else {
      // console.log(foundCampground)
      //render show template with that campground
      res.render("campgrounds/show.ejs", { campground: foundCampground });
    }
  });
});

// NEW COMMENT ROUTE
app.get("/campgrounds/:id/comments/new", isLoggedIn, (req, res) => {

  //find campground by id
  Campground.findById(req.params.id, (err, foundCampground) => {
    if (err) {
      console.log(err)
    } else {
      //send the render ejs
      res.render("comments/new.ejs", { campground: foundCampground });

    }
  });
});

//CREATE COMMENT ROUTE 
app.post("/campgrounds/:id/comments", isLoggedIn, (req, res) => {
  //look up campground by ID
  Campground.findById(req.params.id, (err, foundCampground) => {
    if (err) {
      console.log(err);
    } else {
      //create new campground from the form
      const newComment = req.body.comment;

      //save campground to DB
      Comment.create(newComment, (err, foundComment) => {
        if (err) {
          console.log(err);
        } else {
          foundCampground.comments.push(foundComment);
          foundCampground.save();
          //redirect back to the campgrounds page
          res.redirect("/campgrounds/" + foundCampground._id);
        }
      });
    }
  });

});

//==========
//AUTH ROUTE
//==========
//display register form
app.get("/register", (req, res) => {
  res.render("register.ejs");
})

//register new user
app.post("/register", (req, res) => {
  //only save the username
  var newUser = new User({ username: req.body.username });
  //hash the password using the register method in the passport-local-mongoose package
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      return res.render("register.ejs");
    }

    passport.authenticate("local")(req, res, () => {
      res.redirect("/campgrounds")
    });
  });
});

//display login form
app.get("/login", (req, res) => {
  res.render("login.ejs")
});

//log user in
app.post("/login", passport.authenticate("local",
  {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }), (req, res) => {
  });

//logout route
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/campgrounds");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

//localhost setting
app.listen(8080, () => {
  console.log("YelpCamp server has started!!");
  mongoose.connect("mongodb://localhost:27017/yelp_camp", { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true })
    .then(() => {
      console.log("Connected to mongoDB at port 27017");
    });
});

//cloud setting
// app.listen(process.env.PORT, process.env.IP, () => {
//   console.log("YelpCamp server has started!!");
//   mongoose.connect("mongodb://localhost:27017/yelp_camp", { useNewUrlParser: true })
//     .then(() => {
//       console.log("Connected to mongoDB at port 27017");
//     });
// });
