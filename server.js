const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to all requests
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

const databasePath = path.join(__dirname, 'public', 'database.json');

// Initialize database if it doesn't exist
if (!fs.existsSync(databasePath)) {
  fs.writeFileSync(databasePath, JSON.stringify({ 
    users: [], 
    notes: [],
    comments: [],
    likes: [],
    bookmarks: [],
    views: [],
    notifications: [],
    admin: {
      id: "admin123",
      email: "admin@mynotes.com",
      password: bcrypt.hashSync("admin123", 10)
    }
  }, null, 2));
}

// Helper function to read database
function readDatabase() {
  try {
    const data = fs.readFileSync(databasePath, 'utf8').trim();
    return data ? JSON.parse(data) : { 
      users: [], 
      notes: [],
      comments: [],
      likes: [],
      bookmarks: [],
      views: [],
      notifications: [],
      admin: {
        id: "admin123",
        email: "admin@mynotes.com",
        password: bcrypt.hashSync("admin123", 10)
      }
    };
  } catch (err) {
    console.error('Failed to read database:', err.message);
    return { 
      users: [], 
      notes: [],
      comments: [],
      likes: [],
      bookmarks: [],
      views: [],
      notifications: [],
      admin: {
        id: "admin123",
        email: "admin@mynotes.com",
        password: bcrypt.hashSync("admin123", 10)
      }
    };
  }
}

// Helper function to write to database
function writeDatabase(data) {
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

// Create notification
function createNotification(type, userId, relatedUserId, noteId = null, commentId = null) {
  const db = readDatabase();
  const user = db.users.find(u => u.id === userId);
  if (!user) return;
  
  let message = '';
  const relatedUser = db.users.find(u => u.id === relatedUserId);
  
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
  }
  
  db.notifications.push({
    id: Date.now().toString(),
    userId,
    type,
    message,
    noteId,
    commentId,
    isRead: false,
    createdAt: new Date().toISOString()
  });
  
  writeDatabase(db);
}

// Admin middleware
function isAdmin(req, res, next) {
  const { email, password } = req.body;
  const db = readDatabase();
  
  if (email === db.admin.email && bcrypt.compareSync(password, db.admin.password)) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
}

// Track note views
app.get('/api/notes/view/:noteId', (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.query;
  const db = readDatabase();
  
  // Check if view already exists
  const existingView = db.views.find(v => v.noteId === noteId && v.userId === userId);
  
  if (!existingView) {
    db.views.push({
      id: Date.now().toString(),
      noteId,
      userId: userId || 'anonymous',
      createdAt: new Date().toISOString()
    });
    writeDatabase(db);
  }
  
  res.json({ success: true });
});

// Get note view count
app.get('/api/notes/views/:noteId', (req, res) => {
  const { noteId } = req.params;
  const db = readDatabase();
  const views = db.views.filter(v => v.noteId === noteId);
  res.json({ count: views.length });
});

// Like/unlike a note
app.post('/api/notes/like/:noteId', (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const db = readDatabase();
  const existingLikeIndex = db.likes.findIndex(l => l.noteId === noteId && l.userId === userId);
  
  if (existingLikeIndex === -1) {
    // Add like
    db.likes.push({
      id: Date.now().toString(),
      noteId,
      userId,
      createdAt: new Date().toISOString()
    });
    
    // Create notification
    const note = db.notes.find(n => n.id === noteId);
    if (note && note.userId !== userId) {
      createNotification('like', note.userId, userId, noteId);
    }
    
    writeDatabase(db);
    res.json({ liked: true });
  } else {
    // Remove like
    db.likes.splice(existingLikeIndex, 1);
    writeDatabase(db);
    res.json({ liked: false });
  }
});

// Check if user liked a note
app.get('/api/notes/like/:noteId', (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const db = readDatabase();
  const liked = db.likes.some(l => l.noteId === noteId && l.userId === userId);
  res.json({ liked });
});

// Get like count for a note
app.get('/api/notes/likes/:noteId', (req, res) => {
  const { noteId } = req.params;
  const db = readDatabase();
  const likes = db.likes.filter(l => l.noteId === noteId);
  res.json({ count: likes.length });
});

// Add comment
app.post('/api/notes/comment/:noteId', upload.single('attachment'), (req, res) => {
  const { noteId } = req.params;
  const { userId, content, parentCommentId } = req.body;
  const attachment = req.file;
  
  if (!userId || !content) {
    return res.status(400).json({ error: 'userId and content are required' });
  }
  
  const db = readDatabase();
  const user = db.users.find(u => u.id === userId);
  const note = db.notes.find(n => n.id === noteId);
  
  if (!user || !note) {
    return res.status(404).json({ error: 'User or note not found' });
  }
  
  const newComment = {
    id: Date.now().toString(),
    noteId,
    userId,
    userName: user.name,
    userAvatar: user.avatar,
    content,
    parentCommentId: parentCommentId || null,
    attachment: attachment ? `/assets/${attachment.filename}` : null,
    createdAt: new Date().toISOString()
  };
  
  db.comments.push(newComment);
  
  // Create notification if not replying to self
  if (note.userId !== userId && !parentCommentId) {
    createNotification('comment', note.userId, userId, noteId);
  } else if (parentCommentId) {
    const parentComment = db.comments.find(c => c.id === parentCommentId);
    if (parentComment && parentComment.userId !== userId) {
      createNotification('reply', parentComment.userId, userId, noteId, parentCommentId);
    }
  }
  
  writeDatabase(db);
  res.status(201).json(newComment);
});

// Get comments for a note
app.get('/api/notes/comments/:noteId', (req, res) => {
  const { noteId } = req.params;
  const db = readDatabase();
  const comments = db.comments
    .filter(c => c.noteId === noteId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  // Build comment tree
  const commentMap = {};
  const roots = [];
  
  comments.forEach(comment => {
    comment.replies = [];
    commentMap[comment.id] = comment;
    
    if (comment.parentCommentId) {
      if (commentMap[comment.parentCommentId]) {
        commentMap[comment.parentCommentId].replies.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });
  
  res.json(roots);
});

// Bookmark a note
app.post('/api/notes/bookmark/:noteId', (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const db = readDatabase();
  const existingBookmarkIndex = db.bookmarks.findIndex(b => b.noteId === noteId && b.userId === userId);
  
  if (existingBookmarkIndex === -1) {
    // Add bookmark
    db.bookmarks.push({
      id: Date.now().toString(),
      noteId,
      userId,
      createdAt: new Date().toISOString()
    });
    writeDatabase(db);
    res.json({ bookmarked: true });
  } else {
    // Remove bookmark
    db.bookmarks.splice(existingBookmarkIndex, 1);
    writeDatabase(db);
    res.json({ bookmarked: false });
  }
});

// Check if note is bookmarked by user
app.get('/api/notes/bookmark/:noteId', (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const db = readDatabase();
  const bookmarked = db.bookmarks.some(b => b.noteId === noteId && b.userId === userId);
  res.json({ bookmarked });
});

// Get user's bookmarks
app.get('/api/bookmarks/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDatabase();
  
  const bookmarkNotes = db.bookmarks
    .filter(b => b.userId === userId)
    .map(b => db.notes.find(n => n.id === b.noteId))
    .filter(note => note); // Filter out undefined if note was deleted
  
  res.json(bookmarkNotes);
});

// Follow/unfollow user
app.post('/api/users/follow/:userId', (req, res) => {
  const { userId } = req.params;
  const { followerId } = req.body;
  
  if (!followerId) {
    return res.status(400).json({ error: 'followerId is required' });
  }
  
  if (userId === followerId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  const db = readDatabase();
  const user = db.users.find(u => u.id === userId);
  const follower = db.users.find(u => u.id === followerId);
  
  if (!user || !follower) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Initialize followers array if not exists
  if (!user.followers) user.followers = [];
  if (!follower.following) follower.following = [];
  
  const isFollowing = user.followers.includes(followerId);
  
  if (isFollowing) {
    // Unfollow
    user.followers = user.followers.filter(id => id !== followerId);
    follower.following = follower.following.filter(id => id !== userId);
  } else {
    // Follow
    user.followers.push(followerId);
    follower.following.push(userId);
    
    // Create notification
    createNotification('follow', userId, followerId);
  }
  
  writeDatabase(db);
  res.json({ following: !isFollowing });
});

// Check if user is following another user
app.get('/api/users/is-following/:userId', (req, res) => {
  const { userId } = req.params;
  const { followerId } = req.query;
  
  if (!followerId) {
    return res.status(400).json({ error: 'followerId is required' });
  }
  
  const db = readDatabase();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const isFollowing = user.followers?.includes(followerId) || false;
  res.json({ isFollowing });
});

// Get user notifications
app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDatabase();
  
  const notifications = db.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(notifications);
});

// Mark notification as read
app.put('/api/notifications/read/:notificationId', (req, res) => {
  const { notificationId } = req.params;
  const db = readDatabase();
  
  const notification = db.notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
    writeDatabase(db);
  }
  
  res.json({ success: true });
});

// Share note
app.post('/api/notes/share/:noteId', (req, res) => {
  const { noteId } = req.params;
  const { userId, sharedWithId } = req.body;
  
  if (!userId || !sharedWithId) {
    return res.status(400).json({ error: 'userId and sharedWithId are required' });
  }
  
  const db = readDatabase();
  const note = db.notes.find(n => n.id === noteId);
  const sharedWith = db.users.find(u => u.id === sharedWithId);
  
  if (!note || !sharedWith) {
    return res.status(404).json({ error: 'Note or user not found' });
  }
  
  // Create notification
  createNotification('share', sharedWithId, userId, noteId);
  
  res.json({ success: true });
});

// Get user stats
app.get('/api/users/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDatabase();
  
  const notes = db.notes.filter(n => n.userId === userId);
  const publicNotes = notes.filter(n => n.isPublic);
  const bookmarks = db.bookmarks.filter(b => b.userId === userId).length;
  
  // Calculate total views and likes
  let totalViews = 0;
  let totalLikes = 0;
  
  notes.forEach(note => {
    totalViews += db.views.filter(v => v.noteId === note.id).length;
    totalLikes += db.likes.filter(l => l.noteId === note.id).length;
  });
  
  res.json({
    totalNotes: notes.length,
    totalPublicNotes: publicNotes.length,
    totalBookmarks: bookmarks,
    totalViews,
    totalLikes,
    followers: db.users.find(u => u.id === userId)?.followers?.length || 0,
    following: db.users.find(u => u.id === userId)?.following?.length || 0
  });
});

// Admin endpoints
app.post('/api/admin/login', isAdmin, (req, res) => {
  const db = readDatabase();
  res.json({ 
    success: true,
    admin: {
      id: db.admin.id,
      email: db.admin.email
    }
  });
});

app.get('/api/admin/users', (req, res) => {
  const db = readDatabase();
  res.json(db.users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    isSuspended: user.isSuspended || false,
    notesCount: db.notes.filter(n => n.userId === user.id).length
  })));
});

app.put('/api/admin/users/suspend/:userId', (req, res) => {
  const { userId } = req.params;
  const { suspend } = req.body;
  
  const db = readDatabase();
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  db.users[userIndex].isSuspended = suspend;
  writeDatabase(db);
  
  res.json({ success: true, isSuspended: suspend });
});

app.delete('/api/admin/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  const db = readDatabase();
  
  // Remove note
  const noteIndex = db.notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  db.notes.splice(noteIndex, 1);
  
  // Remove related data
  db.comments = db.comments.filter(c => c.noteId !== noteId);
  db.likes = db.likes.filter(l => l.noteId !== noteId);
  db.bookmarks = db.bookmarks.filter(b => b.noteId !== noteId);
  db.views = db.views.filter(v => v.noteId !== noteId);
  
  writeDatabase(db);
  res.json({ success: true });
});

// API Endpoints from original code (updated)
app.get('/api/users', (req, res) => {
  const db = readDatabase();
  res.json(db.users);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  const user = db.users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    createdAt: user.createdAt,
    isSuspended: user.isSuspended || false
  });
});

app.get('/api/notes/public', (req, res) => {
  const db = readDatabase();
  const publicNotes = db.notes.filter(note => note.isPublic && !db.users.find(u => u.id === note.userId)?.isSuspended);
  
  // Add stats to each note
  const notesWithStats = publicNotes.map(note => {
    const views = db.views.filter(v => v.noteId === note.id).length;
    const likes = db.likes.filter(l => l.noteId === note.id).length;
    const comments = db.comments.filter(c => c.noteId === note.id).length;
    
    return {
      ...note,
      views,
      likes,
      comments
    };
  });
  
  res.json(notesWithStats);
});

app.get('/api/notes/user/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDatabase();
  const userNotes = db.notes.filter(note => note.userId === userId);
  
  // Add stats to each note
  const notesWithStats = userNotes.map(note => {
    const views = db.views.filter(v => v.noteId === note.id).length;
    const likes = db.likes.filter(l => l.noteId === note.id).length;
    const comments = db.comments.filter(c => c.noteId === note.id).length;
    
    return {
      ...note,
      views,
      likes,
      comments
    };
  });
  
  res.json(notesWithStats);
});

app.post('/api/notes', upload.single('image'), (req, res) => {
  const { title, content, userId, isPublic } = req.body;
  const image = req.file;
  
  if (!title || !content || !userId) {
    return res.status(400).json({ error: 'Title, content, and userId are required' });
  }

  const db = readDatabase();
  const newNote = {
    id: Date.now().toString(),
    title,
    content,
    userId,
    isPublic: !!isPublic,
    image: image ? `/assets/${image.filename}` : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.notes.push(newNote);
  writeDatabase(db);

  res.status(201).json(newNote);
});

app.put('/api/notes/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, content, isPublic, removeImage } = req.body;
  const image = req.file;

  const db = readDatabase();
  const noteIndex = db.notes.findIndex(n => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const updatedNote = {
    ...db.notes[noteIndex],
    title: title || db.notes[noteIndex].title,
    content: content || db.notes[noteIndex].content,
    isPublic: isPublic !== undefined ? isPublic : db.notes[noteIndex].isPublic,
    image: image ? `/assets/${image.filename}` : 
           removeImage === 'true' ? null : db.notes[noteIndex].image,
    updatedAt: new Date().toISOString()
  };

  db.notes[noteIndex] = updatedNote;
  writeDatabase(db);

  res.json(updatedNote);
});

app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;

  const db = readDatabase();
  const noteIndex = db.notes.findIndex(n => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  db.notes.splice(noteIndex, 1);
  
  // Remove related comments, likes, etc.
  db.comments = db.comments.filter(c => c.noteId !== id);
  db.likes = db.likes.filter(l => l.noteId !== id);
  db.bookmarks = db.bookmarks.filter(b => b.noteId !== id);
  db.views = db.views.filter(v => v.noteId !== id);
  
  writeDatabase(db);

  res.json({ message: 'Note deleted successfully' });
});

app.post('/api/register', (req, res) => {
  const { name, email, password, bio } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const db = readDatabase();
  
  // Check if email already exists (case insensitive)
  const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    id: Date.now().toString(),
    name,
    email: email.toLowerCase(), // Store email in lowercase
    password: hashedPassword,
    bio: bio || '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4a6fa5&color=fff`,
    createdAt: new Date().toISOString(),
    isSuspended: false
  };

  db.users.push(newUser);
  writeDatabase(db);

  // Don't return password hash
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = readDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: 'Account suspended. Please contact admin.' });
  }

  // Don't return password hash
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.put('/api/users/:id', upload.single('avatar'), (req, res) => {
  const { id } = req.params;
  const { name, bio, removeAvatar } = req.body;
  const avatar = req.file;

  const db = readDatabase();
  const userIndex = db.users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updatedUser = {
    ...db.users[userIndex],
    name: name || db.users[userIndex].name,
    bio: bio !== undefined ? bio : db.users[userIndex].bio,
    avatar: avatar ? `/assets/${avatar.filename}` : 
           removeAvatar === 'true' ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name || db.users[userIndex].name)}&background=4a6fa5&color=fff` : 
           db.users[userIndex].avatar
  };

  db.users[userIndex] = updatedUser;
  writeDatabase(db);

  // Don't return password hash
  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// Run server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});