const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const { isLoggedIn } = require('../config/middleware/auth');

router.get('/feed', isLoggedIn, async (req, res) => {
  try {
    const posts = await Post.find().populate('user').sort({ createdAt: -1 });
    const user = await User.findById(req.user.userid); // Ensure the user data is retrieved
    
    res.render('feed', { posts, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/like', isLoggedIn, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user.userid;

    if (post.likes.includes(userId)) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.redirect('/posts/feed'); // Redirect to /posts/feed
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to get post details by ID
router.get('/post/:id', isLoggedIn, async (req, res) => {
  try {
      const post = await Post.findById(req.params.id).populate('user').populate('likes');
      if (!post) {
          return res.status(404).send('Post not found');
      }

      let suggestedPosts = await Post.find({
        _id: { $ne: req.params.id },  // Exclude the current post
        user:  { $ne: post.user._id }   // Exclude posts from the current user (fetching post from different user)      // post.user._id  to Fetch posts from the same user
      }).limit(3);  // Limit the number of suggestions

      res.render('postDetail', { post, user: req.user, suggestedPosts}); // Pass the user object here
  } catch (error) {
      res.status(500).send('Server error');
  }
});




module.exports = router;
