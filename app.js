// app.js
const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const upload = require('./config/multerconfig');
const postRoutes = require('./routes/posts'); // Import post routes

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());




app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile/upload", (req, res) => {
  res.render("Upload");
});

app.post("/upload", isLoggedIn, upload.single("image"), async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  user.profilepic = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

app.get("/home", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate("posts");
  res.render("home", { user });
});

// app.post("/register", async (req, res) => {
//   try {
//     const { name, username, email, age, address, password } = req.body;

//     // Check if a user with the same email already exists
//     const existingUser = await userModel.findOne({ email });

//     if (existingUser) {
//       // User already exists
//       return res.status(409).send("Registration failed. User may exist.");
//     }

//     // Create new user if no existing user is found
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = await userModel.create({
//       username,
//       name,
//       age,
//       address,
//       email,
//       password: hashedPassword
//     });

//     // Generate JWT token
//     const token = jwt.sign({ email: email, userid: newUser._id }, "shhhhh");

//     // Set token in cookies
//     res.cookie("token", token);
//     res.status(201).redirect("/login");
//   } catch (err) {
//     // Log and send any unexpected errors
//     console.error(err);
//     res.status(500).send("An unexpected error occurred during registration.");
//   }
// });


app.post("/register", async (req, res) => {
  let { name, username, email, age, address, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) { return res.status(500); }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        name,
        age,
        address,
        email,
        password: hash
      });

      let token = jwt.sign({ email: email, userid: user._id }, "shhhhh");
      res.cookie("token", token);
      res.redirect("login");
    });
  });
});    

app.get("/login", (req, res) => {
  res.render("login");
});

// app.get("/profile", isLoggedIn, async (req, res) => {
//   try {
//     let user = await userModel.findOne({ email: req.user.email })
//       .populate({
//         path: 'posts',
//         populate: { path: 'user' } // Populate the user for each post
//       })
//       .populate({
//         path: 'savedPosts',
//         populate: { path: 'user' } // Populate the user for each saved post
//       });
//     res.render("profile", { user, posts });
//   } catch (error) {
//     console.error("Error fetching profile:", error);
//     res.status(500).send("Server error");
//   }
// });

app.get("/profile", isLoggedIn, async (req, res) => {
  try {
    // Find the user and populate the posts and savedPosts
    let user = await userModel.findOne({ email: req.user.email })
      .populate({
        path: 'posts',
        populate: { path: 'user' } // Populate the user for each post
      })
      .populate({
        path: 'savedPosts',
        populate: { path: 'user' } // Populate the user for each saved post
      });

    // Check if user exists
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Define posts from the user's posts
    let posts = user.posts || [];
    let savedPosts = user.savedPosts || [];


    // Render the profile page with user and posts data
    res.render("profile", { user, posts, savedPosts });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send("Server error");
  }
});


app.post("/post", isLoggedIn, upload.single("postimage"), async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    let { content } = req.body;
    let { heading } = req.body;
    let {hashtags} = req.body;

    const hashtagArray = hashtags ? hashtags.split(',').map(tag => tag.trim()) : [];

    if (!content) {
      return res.status(400).send("Content is required");
    }

    let post = await postModel.create({
      user: user._id,
      heading,
      content,
      hashtags : hashtagArray,
      postpic: req.file ? req.file.filename : null
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Server error");
  }
});


app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }

  await post.save();
  res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("Edit", { post });
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOneAndUpdate({ _id: req.params.id }, 
    {
    content: req.body.content,
    heading: req.body.heading, // Correctly placed heading here
  });
  res.redirect("/profile");
});

app.get('/delete/:id', isLoggedIn, async (req, res)=>{
     let post = await postModel.findOneAndDelete({ _id: req.params.id });
     res.redirect('/profile');
})

//feed


app.use('/posts', postRoutes); //  // Use post routes

app.get('/search', isLoggedIn, async (req, res) => {
  try {
      const searchTerm = req.query.query;

      console.log('Search Term:', searchTerm); // Log the search term

      if (!searchTerm) {
          return res.render('feed', { posts: [], user: req.user, message: 'No search term provided' });
      }

      const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive search

      console.log('Search Regex:', searchRegex); // Log the regex being used

      const posts = await postModel.find({
        $or: [
            { heading: searchRegex },
            { content: searchRegex },
            { hashtags: searchRegex } 
        ]
    }).populate('user');

      console.log('Posts Found:', posts); // Log the posts that were found

      let message = posts.length > 0 ? 'Search Results' : 'No posts found for your search.';
      res.render('feed', { posts, user: req.user, message });
  } catch (error) {
      console.error('Search route error:', error.message, error.stack);
      res.status(500).send('Server error occurred. Please try again later.');
  }
});

//save the post 
app.post('/save/:id', isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userid; // Ensure this matches your user model's ID field

    if (!userId) {
      console.error("User not authenticated");
      return res.status(401).send("User not authenticated");
    }

    const post = await postModel.findById(postId);
    const user = await userModel.findById(userId);

    if (!post || !user) {
      console.error("Post or User not found");
      return res.status(404).send("Post or User not found");
    }

    console.log("Current savedPosts:", user.savedPosts);

    // Check if the post is already saved
    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
      // If the post is already saved, unsave it
      user.savedPosts.pull(postId);
      console.log(`Unsaving post ${postId}`);
    } else {
      // If the post is not saved, save it
      user.savedPosts.push(postId);
      console.log(`Saving post ${postId}`);
    }

    await user.save();

    console.log("Updated savedPosts:", user.savedPosts);

    // Redirect to the feed page or any other page
    res.redirect('/posts/feed');
  } catch (error) {
    console.error("Save post error:", error.message);
    res.status(500).send("An error occurred");
  }
});





app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) { return res.send("login is erroring..."); }

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id,  _id: user._id }, "shhhhh", { expiresIn: '1h' });
      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

      return res.status(200).redirect("/profile");
    } else { return res.redirect('/login'); }
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get('/api/check-auth', (req, res) => {
  // Check for the presence of a token or session to determine if the user is logged in
  const isLoggedIn = !!req.cookies.token; // Example: Check if token exists in cookies

  res.json({ loggedIn: isLoggedIn });
});


function isLoggedIn(req, res, next) {
  console.log("Cookies:", req.cookies);

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send("You must be logged in.");
  }

  try {
    const data = jwt.verify(token, 'shhhhh');
    req.user = data;
    console.log("User Data:", req.user);
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).send("Invalid or expired token.");
  }
}


app.listen(5000);
