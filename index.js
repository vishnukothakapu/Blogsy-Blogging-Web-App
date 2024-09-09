const express = require("express");
const PORT = process.env.PORT || 4000;
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const fs = require("fs");
const path = require('path');
const {MongoClient} = require('mongodb');
const Blog = require('./models/Blog');
const session = require("express-session");
const multer = require("multer");
const generateOTP = require("./lib/otp");
const { sendOtpEmail } = require("./lib/mailer");
let name, email, image, otp;
let isOtpGenerated = false;
require("dotenv").config();
require("./lib/passport-setup");
const UserModel = require("./models/User");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MONGODB CONNECTION


const uri = process.env.MONGO_URI; // Replace with your Atlas connection string

async function connectToDatabase() {
  try {
    await mongoose.connect(uri)
      .then(() => {
        console.log('connected to db');
      })
  }
  catch (err) { console.log(err); }
}

connectToDatabase();


// Passport configurations
passport.use(UserModel.createStrategy());
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

// File Uploading
const uploadPath = "public/uploads";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);
app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);
// Home route
app.get("/", async (req, res) => {
  if (req.isAuthenticated()) {
    req.user = req.user;
    
  }
  else {
    req.user = null;
  }
  try {
    const search = req.query.search || "";
    const latestBlog = await Blog.find({}).sort({ likes: -1 }).populate("author").limit(1);
    let message;
    let blogs = await Blog.find({}).populate
    ("author").sort({ createdAt: -1 });
    blogs.forEach((blog) => {
      if (!Array.isArray(blog.likes)) {
        blog.likes = [];
      }
    });
    if (search) {
      blogs = blogs.filter(
        (post) =>
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          (post.tags &&
            post.tags.some((tag) =>
              tag.toLowerCase().includes(search.toLowerCase())
            ))
      );
      if (blogs.length === 0) {
        message = `No blogs found with "${search}"`;
      }
    } else {
      if (blogs.length === 0) {
        message = "No blogs available";
      }
    }
    res.render("home", {
      latestBlog,
      blog: blogs,
      search: search,
      user: req.user,
      message,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving blogs");
  }
});


// Register Routes
app.get("/register", (req, res) => {
  if (req.isAuthenticated()) {
    return redirect('/dashboard');
  }
  res.render("register", { message: null, color: null });
});
app.post("/register", upload.single("image"), async (req, res) => {
  name = req.body.name;
  email = req.body.username;
  image = req.file.filename;
  otp = generateOTP();

  try {
    const existingUser = await UserModel.findOne({ username: email });
    if (existingUser) {
      res.render("login", {
        message: "User already exists. Please Login",
        color: "yellow",
      });
    } else {
      let subject = "Email verification";
      await sendOtpEmail(email, subject, name, otp);
      isOtpGenerated = true;
      console.log(`OTP sent successfully to ${email}`);
      res.render("otp", { mail: email, message: null, color: null });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error sending OTP email");
  }
});

// OTP-Verification
app.post("/otp-verify", (req, res) => {
  let userOTP = req.body.otp;
  let email = req.body.username;
  if (userOTP === otp) {
    res.render("setPassword", {
      message: "OTP Verified Successfully. Please create a password.",
      color: "green",
    });
  } else {
    res.render("otp", {
      mail: email,
      message: "Incorrect OTP. Please try again",
      color: "yellow",
    });
  }
});

app.post("/set-password", async (req, res) => {
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword;
  if (password === confirmPassword) {
    try {
      await UserModel.register(
        { name, username: email, image: image, posts: [] },
        password
      );
      res.render("login", {
        message: "User registered successfully. Please Login",
        color: "green",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Error registering user");
    }
  } else {
    res.render("setPassword", {
      message: "Passwords did not match. Try again",
      color: "red",
    });
  }
});

// LOGIN ROUTES
app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/dashboard");
  }
  res.render("login", { message: null, color: null });
});
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.log(err);
      return next(err);
    }
    if (!user) {
      return res.render("login", {
        message: "Invalid username or password. Please try again",
        color: "yellow",
      });
    }
    req.login(user, (err) => {
      if (err) {
        console.log(err);
        return next(err);
      }
      return res.redirect("/dashboard");
    });
  })(req, res, next);
});

// DASHBOARD
app.get("/dashboard", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await UserModel.findById(req.user._id).populate("posts");
    res.render("dashboard", { user, color: null, message: null });
  } else {
    res.render("login",{message:'Please login to access dashboard',color:null});
  }
});

// UPDATE/EDIT PROFILE
app.get("/edit-profile", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("editProfile", {
      message: null,
      color: null,
      name: req.user.name,
      image: req.user.image,
      user:req.user,
    });
  } else {
    res.render("login", { message: "Login to access or edit your profile",color:"yellow" });
  }
});

app.post("/edit-profile", upload.single("image"), async (req, res) => {
  if (req.isAuthenticated()) {
     const userId = req.user._id;
     try {
       const userData = await UserModel.findById(userId);
       const updateData = {
         name: req.body.name || userData.name,
        image: req.file ? req.file.filename : userData.image,
       }
       const updatedUser = await UserModel.findByIdAndUpdate(
         userId,updateData,
         { new: true }
       );
       res.redirect("/dashboard");
     } catch (err) {
       console.log(err);
       res.status(500).send("Error updating profile");
     }
  }
  else {
    res.render("login", {
      message: "Please login to update your profile",
      color: "yellow",
    });
  }
 });

// UPDATE PASSWORD
app.get("/check-mail", (req, res) => {
  res.render("checkMail", {mail:null,message: null, color: null });
});

app.post("/check-mail", async (req, res) => {
  let username = req.body.username;
  try {
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      otp = generateOTP();
      let subject = "Reset Password";
      await sendOtpEmail(username, subject, existingUser.name, otp);
      isOtpGenerated = true;
      res.render("resetOtp", { mail: username, message: null, color: null });
    } else {
      res.render("register", {
        message: `User not found with ${username}. Please register`,
        color: "red",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error sending OTP email");
  }
});

app.post("/reset-otp-verify", (req, res) => {
  let userOTP = req.body.otp;
  let username = req.body.username;
  if (userOTP === otp) {
    res.render("resetPass", {
      mail: username,
      message: "OTP Verified Successfully. Please create a new password.",
      color: "green",
    });
  } else {
    res.render("resetOtp", {
      mail: username,
      message: "Incorrect OTP. Please try again",
      color: "yellow",
    });
  }
});

app.post("/reset-password", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  if (password === confirmPassword) {
    try {
      await UserModel.findOne({ username: email })
        .then((user) => {
          if (!user) {
            res.render('register', {
              message: 'User not found.please register',
              color: 'red',
            });
            return;
          }
          user.setPassword(password, (err) => {
            if (err) {
              console.log(err);
              res.render("checkMail", {
                message: "Error resetting password.please try again",
                color: "yellow",
              });
               return;
            }
            user.save()
              .then(() => {
                res.render('login', {
                  message: 'Password reset successfully. please login',
                  color: 'green',
                })
              })
              .catch((err) => {
                console.log(err);
                res.render('checkMail', {
                  message: 'Error resetting password.please try again',
                  color: 'yellow',
                })
              });
          })
      })
    } catch (err) {
      console.log(err);
      res.status(500).send("Error resetting password");
    }
  } else {
    res.render("resetPass", {
      mail: email,
      message: "Passwords did not match. Please try again",
      color: "yellow",
    });
  }
});
// app.get('/otplogin', (req, res) => {
//   res.render('setPassword',{message:null,color:null});
// })
// UPDATE PASSWORD 
app.get('/update-password', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('updatePass', { message: null, mail: req.user.username,user:req.user, color: null });
  }
  else {
    res.render('login', { message: 'Please Login to update password', color: 'yellow' });
  }
});
app.post("/update-password", async (req, res) => {
  if (req.isAuthenticated()) {
    const oldPass = req.body.oldPass;
    const newPass = req.body.password;
    const confirmNewPass = req.body.confirmPassword;

    if (newPass !== confirmNewPass) {
      return res.render("updatePass", {
        message: "New passwords do not match. Please try again",
        color: "yellow",
        user:req.user,
        mail:req.user.username,
      });
    }

    try {
      const user = req.user;
      user.authenticate(oldPass, (err, result) => {
        if (err || !result) {
          return res.render("updatePass", {
            message: "Old password is incorrect. Please try again",
            color: "yellow",
            user:req.user,
            mail:req.user.username,
          });
        }

        user.setPassword(newPass, async (err) => {
          if (err) {
            console.log(err);
            res.render('updatePass', { message: 'Error updating password.please try again', color:'red',mail:req.user.username,user:req.user});
            return res.status(500).send("Error updating password");
          }

          try {
            await user.save();
            res.render("dashboard", {
              user: req.user,
              message: "Password updated successfully",
              color: "green",
            });
          } catch (saveErr) {
            console.log(saveErr);
            res.status(500).send("Error saving user");
          }
        });
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Error updating password");
    }
  } else {
    res.render("login",{message:'Please Login',color:'yellow'});
  }
});

// LOGOUT ROUTE
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err);
        return next(err);
      }
      res.render("login", { message: "Logged out successfully", color: "red" });
    });
  });
});
// POST BLOG
app.get('/post-blog', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('postBlog',{message:null,color:null,user:req.user});
  }
  else {
    res.render('login', { message: 'Please login to post/write a blog.', color: 'yellow' })
  }
});
app.post('/post-blog', upload.single('image'), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.render("login", {
      message: "Please login to post a blog.",
      color: "yellow",
    });
  }
  const userId = req.user._id;
  const title = req.body.title;
  const content = req.body.content;
  const tags = req.body.tags;
  const image = req.file ? req.file.filename : null;
  const blog = await Blog.create({
    title,
    content,
    author: userId,
    image,
    tags,
  });
  await UserModel.findByIdAndUpdate(
    userId,
    { $push: { posts: blog._id } },
    { new: true }
  )
    .then(() => {
      res.redirect('/dashboard');
    })
    .catch((err) =>
      console.log(err));
});
// Like a blog post
app.post("/like/:id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const blog = await Blog.findById(req.params.id);
      if (!Array.isArray(blog.likes)) {
        blog.likes = [];
      }

      if (blog.likes.includes(req.user._id)) {
        // Remove like
        blog.likes = blog.likes.filter((id) => !id.equals(req.user._id));
      } else {
        // Add like
        blog.likes.push(req.user._id);
      }
      await blog.save();
      res.redirect('/blog/'+req.params.id);
    } catch (err) {
      console.log("Error:", err.message);
      res.status(500).send("Error updating likes");
    }
  }
  else {
    res.render('login', { message: 'Please login to like a blog post', color: 'yellow' });
  }
});



// Add a comment to a blog post
app.post('/comment/:id', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.render('login', { message: 'Please login to comment on a blog.', color: 'yellow' });
  }

  const { text } = req.body;

  try {
    const blog = await Blog.findById(req.params.id);
    blog.comments.push({ text, author: req.user._id });
    await blog.save();
    res.redirect(`/blog/${req.params.id}`);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error adding comment to the blog post');
  }
});

// Add a reply to a comment
app.post('/reply/:blogId/:commentId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.render('login', { message: 'Please login to reply to a comment.', color: 'yellow' });
  }

  const { text } = req.body;

  try {
    const blog = await Blog.findById(req.params.blogId);
    const comment = blog.comments.id(req.params.commentId);
    comment.replies.push({ text, author: req.user._id });
    await blog.save();
    res.redirect(`/blog/${req.params.blogId}`);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error replying to the comment');
  }
});

// DISPLAY SPECIFIC BLOG
app.get("/blog/:id", async (req, res) => {
  if (req.isAuthenticated()) {
    req.user = req.user;
  }
  else {
    req.user = null;
  }
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author") 
      .populate({
        path: "comments",
        populate: {
          path: "author", 
        },
      })
      .populate({
        path: "comments.replies",
        populate: {
          path: "author", 
        },
      });

    if (!blog) {
      return res.status(404).send("Blog post not found");
    }

    res.render("blog", { blog ,user:req.user,search:req.query.search||""});
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading blog post");
  }
});
// Displaying all users
app.get("/users", async (req, res) => {
  try {
    const users = await UserModel.find();
    res.render("users", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
//EDIT BLOG ROUTE
app.get("/blog/edit/:id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) {
        return res.status(404).send("Blog post not found");
      }
      res.render("editBlog", { blog,user:req.user });
    } catch (error) {
      console.error(error);
      res.redirect("/");
    }
  } else {

    res.redirect("/");
  }
});
app.post("/blog/edit/:id", upload.single("image"), async (req, res) => {
  if (req.isAuthenticated()) {
    const { title, content, tags } = req.body;
    const blogId = req.params.id;
    const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()) : [];

    try {
      const existingBlog = await Blog.findById(blogId);

      const updateData = {
        title: title || existingBlog.title,
        content: content || existingBlog.content,
        tags: tagsArray.length > 0 ? tagsArray : existingBlog.tags,
        image: req.file ? req.file.filename : existingBlog.image,
      };

      // Update the blog post
      await Blog.findByIdAndUpdate(blogId, updateData, { new: true });
      const user = await UserModel.findById(req.user._id).populate("posts");
      console.log("User details: ", user);
      if (!user) {
        return res.status(404).send("User not found");
      }
      res.redirect('/dashboard');
    } catch (err) {
      res.render("dashboard", {
        user: req.user,
        message: "Error updating blog. Please try again",
        color: "yellow",
      });
      console.log(err);
    }
  } else {
    res.render("login", {
      color: "red",
      message: "Login required to edit/view your blogs.",
    });
  }
});

// SERVER PORT
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
