require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://vynaavalerie:hVwqPu9S4qaARnLc@cluster0.v5c9etv.mongodb.net/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected!'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Note = require('./models/Note');
const Comment = require('./models/Comment');
const Like = require('./models/Like');
const Bookmark = require('./models/Bookmark');
const View = require('./models/View');
const Notification = require('./models/Notification');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/assets/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper function to create notification
async function createNotification(type, userId, relatedUserId, noteId = null, commentId = null) {
  const user = await User.findById(userId);
  const relatedUser = await User.findById(relatedUserId);
  
  if (!user || !relatedUser) return;
  
  let message = '';
  
  switch(type) {
    case 'like':
      message = `${relatedUser.name} menyukai catatan Anda`;
      break;
    case 'comment':
      message = `${relatedUser.name} mengomentari catatan Anda`;
      break;
    case 'reply':
      message = `${relatedUser.name} membalas komentar Anda`;
      break;
    case 'follow':
      message = `${relatedUser.name} mulai mengikuti Anda`;
      break;
    case 'share':
      message = `${relatedUser.name} membagikan catatan kepada Anda`;
      break;
  }
  
  const notification = new Notification({
    userId,
    type,
    message,
    noteId,
    commentId,
    relatedUserId,
    isRead: false
  });
  
  await notification.save();
}

// Admin middleware
async function isAdmin(req, res, next) {
  const { email, password } = req.body;
  
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
}

// API Endpoints

// Track note views
app.get('/api/notes/view/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.query;
    
    // Check if view already exists
    const existingView = await View.findOne({ 
      noteId, 
      userId: userId || 'anonymous' 
    });
    
    if (!existingView) {
      const view = new View({
        noteId,
        userId: userId || 'anonymous'
      });
      await view.save();
      
      // Increment view count in Note
      await Note.findByIdAndUpdate(noteId, { $inc: { views: 1 } });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get note view count
app.get('/api/notes/views/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const count = await View.countDocuments({ noteId });
    res.json({ count });
  } catch (error) {
    console.error('Error getting views:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like/unlike a note
app.post('/api/notes/like/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const existingLike = await Like.findOne({ noteId, userId });
    
    if (!existingLike) {
      // Add like
      const like = new Like({ noteId, userId });
      await like.save();
      
      // Increment like count in Note
      await Note.findByIdAndUpdate(noteId, { $inc: { likes: 1 } });
      
      // Create notification
      const note = await Note.findById(noteId);
      if (note && note.userId.toString() !== userId) {
        await createNotification('like', note.userId, userId, noteId);
      }
      
      res.json({ liked: true });
    } else {
      // Remove like
      await Like.findByIdAndDelete(existingLike._id);
      
      // Decrement like count in Note
      await Note.findByIdAndUpdate(noteId, { $inc: { likes: -1 } });
      
      res.json({ liked: false });
    }
  } catch (error) {
    console.error('Error liking note:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user liked a note
app.get('/api/notes/like/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const liked = await Like.exists({ noteId, userId });
    res.json({ liked: !!liked });
  } catch (error) {
    console.error('Error checking like:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get like count for a note
app.get('/api/notes/likes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const count = await Like.countDocuments({ noteId });
    res.json({ count });
  } catch (error) {
    console.error('Error getting likes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment
app.post('/api/notes/comment/:noteId', upload.single('attachment'), async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId, content, parentCommentId } = req.body;
    const attachment = req.file;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }
    
    const user = await User.findById(userId);
    const note = await Note.findById(noteId);
    
    if (!user || !note) {
      return res.status(404).json({ error: 'User or note not found' });
    }
    
    const newComment = new Comment({
      noteId,
      userId,
      content,
      parentCommentId: parentCommentId || null,
      attachment: attachment ? `/assets/${attachment.filename}` : null
    });
    
    await newComment.save();
    
    // Increment comment count in Note
    await Note.findByIdAndUpdate(noteId, { $inc: { comments: 1 } });
    
    // Create notification if not replying to self
    if (note.userId.toString() !== userId && !parentCommentId) {
      await createNotification('comment', note.userId, userId, noteId);
    } else if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment && parentComment.userId.toString() !== userId) {
        await createNotification('reply', parentComment.userId, userId, noteId, parentCommentId);
      }
    }
    
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for a note
app.get('/api/notes/comments/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // Get all comments for this note
    const comments = await Comment.find({ noteId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: 1 });
    
    // Build comment tree
    const commentMap = {};
    const roots = [];
    
    comments.forEach(comment => {
      comment.replies = [];
      commentMap[comment._id] = comment;
      
      if (comment.parentCommentId) {
        if (commentMap[comment.parentCommentId]) {
          commentMap[comment.parentCommentId].replies.push(comment);
        }
      } else {
        roots.push(comment);
      }
    });
    
    res.json(roots);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bookmark a note
app.post('/api/notes/bookmark/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const existingBookmark = await Bookmark.findOne({ noteId, userId });
    
    if (!existingBookmark) {
      // Add bookmark
      const bookmark = new Bookmark({ noteId, userId });
      await bookmark.save();
      res.json({ bookmarked: true });
    } else {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      res.json({ bookmarked: false });
    }
  } catch (error) {
    console.error('Error bookmarking note:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if note is bookmarked by user
app.get('/api/notes/bookmark/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const bookmarked = await Bookmark.exists({ noteId, userId });
    res.json({ bookmarked: !!bookmarked });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bookmarks
app.get('/api/bookmarks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const bookmarks = await Bookmark.find({ userId })
      .populate({
        path: 'noteId',
        populate: {
          path: 'userId',
          select: 'name avatar'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json(bookmarks.map(b => b.noteId).filter(note => note));
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow/unfollow user
app.post('/api/users/follow/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;
    
    if (!followerId) {
      return res.status(400).json({ error: 'followerId is required' });
    }
    
    if (userId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const user = await User.findById(userId);
    const follower = await User.findById(followerId);
    
    if (!user || !follower) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isFollowing = user.followers.includes(followerId);
    
    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(userId, { $pull: { followers: followerId } });
      await User.findByIdAndUpdate(followerId, { $pull: { following: userId } });
      res.json({ following: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(userId, { $addToSet: { followers: followerId } });
      await User.findByIdAndUpdate(followerId, { $addToSet: { following: userId } });
      
      // Create notification
      await createNotification('follow', userId, followerId);
      
      res.json({ following: true });
    }
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user is following another user
app.get('/api/users/is-following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.query;
    
    if (!followerId) {
      return res.status(400).json({ error: 'followerId is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isFollowing = user.followers.includes(followerId);
    res.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('relatedUserId', 'name avatar')
      .populate('noteId', 'title');
    
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/read/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Share note
app.post('/api/notes/share/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId, sharedWithId } = req.body;
    
    if (!userId || !sharedWithId) {
      return res.status(400).json({ error: 'userId and sharedWithId are required' });
    }
    
    const note = await Note.findById(noteId);
    const sharedWith = await User.findById(sharedWithId);
    
    if (!note || !sharedWith) {
      return res.status(404).json({ error: 'Note or user not found' });
    }
    
    // Create notification
    await createNotification('share', sharedWithId, userId, noteId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sharing note:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user stats
app.get('/api/users/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notesCount = await Note.countDocuments({ userId });
    const publicNotesCount = await Note.countDocuments({ userId, isPublic: true });
    const bookmarksCount = await Bookmark.countDocuments({ userId });
    
    // Calculate total views and likes
    const notes = await Note.find({ userId });
    const noteIds = notes.map(note => note._id);
    
    const totalViews = await View.countDocuments({ noteId: { $in: noteIds } });
    const totalLikes = await Like.countDocuments({ noteId: { $in: noteIds } });
    
    const user = await User.findById(userId);
    const followersCount = user.followers.length;
    const followingCount = user.following.length;
    
    res.json({
      totalNotes: notesCount,
      totalPublicNotes: publicNotesCount,
      totalBookmarks: bookmarksCount,
      totalViews,
      totalLikes,
      followers: followersCount,
      following: followingCount
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin endpoints
app.post('/api/admin/login', isAdmin, async (req, res) => {
  res.json({ 
    success: true,
    admin: {
      email: process.env.ADMIN_EMAIL
    }
  });
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email createdAt isSuspended')
      .sort({ createdAt: -1 });
    
    // Add notes count for each user
    const usersWithStats = await Promise.all(users.map(async user => {
      const notesCount = await Note.countDocuments({ userId: user._id });
      return {
        ...user.toObject(),
        notesCount
      };
    }));
    
    res.json(usersWithStats);
  } catch (error) {
    console.error('Error getting admin users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/users/suspend/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspend } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId, 
      { isSuspended: suspend },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, isSuspended: user.isSuspended });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // Remove note and related data in transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await Note.findByIdAndDelete(noteId).session(session);
      await Comment.deleteMany({ noteId }).session(session);
      await Like.deleteMany({ noteId }).session(session);
      await Bookmark.deleteMany({ noteId }).session(session);
      await View.deleteMany({ noteId }).session(session);
      
      await session.commitTransaction();
      res.json({ success: true });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Regular API endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email avatar bio createdAt');
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, 'name email bio avatar createdAt isSuspended');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/notes/public', async (req, res) => {
  try {
    const publicNotes = await Note.find({ isPublic: true })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    
    res.json(publicNotes);
  } catch (error) {
    console.error('Error getting public notes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/notes/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userNotes = await Note.find({ userId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    
    res.json(userNotes);
  } catch (error) {
    console.error('Error getting user notes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/notes', upload.single('image'), async (req, res) => {
  try {
    const { title, content, userId, isPublic } = req.body;
    const image = req.file;
    
    if (!title || !content || !userId) {
      return res.status(400).json({ error: 'Title, content, and userId are required' });
    }

    const newNote = new Note({
      title,
      content,
      userId,
      isPublic: !!isPublic,
      image: image ? `/assets/${image.filename}` : null
    });

    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/notes/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPublic, removeImage } = req.body;
    const image = req.file;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (title) note.title = title;
    if (content) note.content = content;
    if (isPublic !== undefined) note.isPublic = isPublic;
    
    if (image) {
      note.image = `/assets/${image.filename}`;
    } else if (removeImage === 'true') {
      note.image = null;
    }
    
    note.updatedAt = new Date();
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Remove note and related data in transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await Note.findByIdAndDelete(id).session(session);
      await Comment.deleteMany({ noteId: id }).session(session);
      await Like.deleteMany({ noteId: id }).session(session);
      await Bookmark.deleteMany({ noteId: id }).session(session);
      await View.deleteMany({ noteId: id }).session(session);
      
      await session.commitTransaction();
      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, bio } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const emailExists = await User.exists({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      bio: bio || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4a6fa5&color=fff`
    });

    await newUser.save();

    // Don't return password hash
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended. Please contact admin.' });
    }

    // Don't return password hash
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, removeAvatar } = req.body;
    const avatar = req.file;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    
    if (avatar) {
      user.avatar = `/assets/${avatar.filename}`;
    } else if (removeAvatar === 'true') {
      user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user.name)}&background=4a6fa5&color=fff`;
    }
    
    await user.save();

    // Don't return password hash
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Run server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});