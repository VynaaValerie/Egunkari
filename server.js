const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://akses-pinaa-default-rtdb.firebaseio.com"
});

const db = admin.database();
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

// Firebase Database Helper Functions
async function getData(path) {
  const snapshot = await db.ref(path).once('value');
  return snapshot.val() || {};
}

async function setData(path, data) {
  await db.ref(path).set(data);
}

async function pushData(path, data) {
  const ref = db.ref(path).push();
  await ref.set(data);
  return ref.key;
}

async function updateData(path, updates) {
  await db.ref(path).update(updates);
}

async function removeData(path) {
  await db.ref(path).remove();
}

// Create notification
async function createNotification(type, userId, relatedUserId, noteId = null, commentId = null) {
  const user = await getData(`users/${userId}`);
  if (!user) return;
  
  const relatedUser = await getData(`users/${relatedUserId}`);
  if (!relatedUser) return;
  
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
  }
  
  const newNotification = {
    userId,
    type,
    message,
    noteId,
    commentId,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  await pushData('notifications', newNotification);
}

// Admin middleware
async function isAdmin(req, res, next) {
  const { email, password } = req.body;
  const adminData = await getData('admin');
  
  if (email === adminData.email && bcrypt.compareSync(password, adminData.password)) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
}

// Track note views
app.get('/api/notes/view/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.query;
  
  // Check if view already exists
  const views = await getData(`views`);
  const existingView = Object.values(views || {}).find(v => v.noteId === noteId && v.userId === userId);
  
  if (!existingView) {
    const newView = {
      noteId,
      userId: userId || 'anonymous',
      createdAt: new Date().toISOString()
    };
    
    await pushData('views', newView);
  }
  
  res.json({ success: true });
});

// Get note view count
app.get('/api/notes/views/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const views = await getData('views');
  const noteViews = Object.values(views || {}).filter(v => v.noteId === noteId);
  res.json({ count: noteViews.length });
});

// Like/unlike a note
app.post('/api/notes/like/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const likes = await getData('likes');
  const existingLikeKey = Object.keys(likes || {}).find(key => 
    likes[key].noteId === noteId && likes[key].userId === userId
  );
  
  if (!existingLikeKey) {
    // Add like
    const newLike = {
      noteId,
      userId,
      createdAt: new Date().toISOString()
    };
    
    await pushData('likes', newLike);
    
    // Create notification
    const note = await getData(`notes/${noteId}`);
    if (note && note.userId !== userId) {
      await createNotification('like', note.userId, userId, noteId);
    }
    
    res.json({ liked: true });
  } else {
    // Remove like
    await removeData(`likes/${existingLikeKey}`);
    res.json({ liked: false });
  }
});

// Check if user liked a note
app.get('/api/notes/like/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const likes = await getData('likes');
  const liked = Object.values(likes || {}).some(l => l.noteId === noteId && l.userId === userId);
  res.json({ liked });
});

// Get like count for a note
app.get('/api/notes/likes/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const likes = await getData('likes');
  const noteLikes = Object.values(likes || {}).filter(l => l.noteId === noteId);
  res.json({ count: noteLikes.length });
});

// Add comment
app.post('/api/notes/comment/:noteId', upload.single('attachment'), async (req, res) => {
  const { noteId } = req.params;
  const { userId, content, parentCommentId } = req.body;
  const attachment = req.file;
  
  if (!userId || !content) {
    return res.status(400).json({ error: 'userId and content are required' });
  }
  
  const user = await getData(`users/${userId}`);
  const note = await getData(`notes/${noteId}`);
  
  if (!user || !note) {
    return res.status(404).json({ error: 'User or note not found' });
  }
  
  const newComment = {
    noteId,
    userId,
    userName: user.name,
    userAvatar: user.avatar,
    content,
    parentCommentId: parentCommentId || null,
    attachment: attachment ? `/assets/${attachment.filename}` : null,
    createdAt: new Date().toISOString()
  };
  
  const commentId = await pushData('comments', newComment);
  
  // Create notification if not replying to self
  if (note.userId !== userId && !parentCommentId) {
    await createNotification('comment', note.userId, userId, noteId);
  } else if (parentCommentId) {
    const parentComment = await getData(`comments/${parentCommentId}`);
    if (parentComment && parentComment.userId !== userId) {
      await createNotification('reply', parentComment.userId, userId, noteId, commentId);
    }
  }
  
  res.status(201).json({ ...newComment, id: commentId });
});

// Get comments for a note
app.get('/api/notes/comments/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const comments = await getData('comments');
  const noteComments = Object.entries(comments || {})
    .map(([id, comment]) => ({ ...comment, id }))
    .filter(c => c.noteId === noteId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  // Build comment tree
  const commentMap = {};
  const roots = [];
  
  noteComments.forEach(comment => {
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
app.post('/api/notes/bookmark/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const bookmarks = await getData('bookmarks');
  const existingBookmarkKey = Object.keys(bookmarks || {}).find(key => 
    bookmarks[key].noteId === noteId && bookmarks[key].userId === userId
  );
  
  if (!existingBookmarkKey) {
    // Add bookmark
    const newBookmark = {
      noteId,
      userId,
      createdAt: new Date().toISOString()
    };
    
    await pushData('bookmarks', newBookmark);
    res.json({ bookmarked: true });
  } else {
    // Remove bookmark
    await removeData(`bookmarks/${existingBookmarkKey}`);
    res.json({ bookmarked: false });
  }
});

// Check if note is bookmarked by user
app.get('/api/notes/bookmark/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const bookmarks = await getData('bookmarks');
  const bookmarked = Object.values(bookmarks || {}).some(b => b.noteId === noteId && b.userId === userId);
  res.json({ bookmarked });
});

// Get user's bookmarks
app.get('/api/bookmarks/:userId', async (req, res) => {
  const { userId } = req.params;
  const bookmarks = await getData('bookmarks');
  const userBookmarks = Object.values(bookmarks || {}).filter(b => b.userId === userId);
  
  // Get all bookmarked notes
  const notes = await getData('notes');
  const bookmarkNotes = userBookmarks
    .map(b => notes[b.noteId])
    .filter(note => note); // Filter out undefined if note was deleted
  
  res.json(bookmarkNotes);
});

// Follow/unfollow user
app.post('/api/users/follow/:userId', async (req, res) => {
  const { userId } = req.params;
  const { followerId } = req.body;
  
  if (!followerId) {
    return res.status(400).json({ error: 'followerId is required' });
  }
  
  if (userId === followerId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }
  
  const user = await getData(`users/${userId}`);
  const follower = await getData(`users/${followerId}`);
  
  if (!user || !follower) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check if already following
  const isFollowing = user.followers && user.followers.includes(followerId);
  
  if (isFollowing) {
    // Unfollow
    await updateData(`users/${userId}`, {
      followers: user.followers.filter(id => id !== followerId)
    });
    
    await updateData(`users/${followerId}`, {
      following: follower.following.filter(id => id !== userId)
    });
    
    res.json({ following: false });
  } else {
    // Follow
    await updateData(`users/${userId}`, {
      followers: [...(user.followers || []), followerId]
    });
    
    await updateData(`users/${followerId}`, {
      following: [...(follower.following || []), userId]
    });
    
    // Create notification
    await createNotification('follow', userId, followerId);
    
    res.json({ following: true });
  }
});

// Check if user is following another user
app.get('/api/users/is-following/:userId', async (req, res) => {
  const { userId } = req.params;
  const { followerId } = req.query;
  
  if (!followerId) {
    return res.status(400).json({ error: 'followerId is required' });
  }
  
  const user = await getData(`users/${userId}`);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const isFollowing = user.followers?.includes(followerId) || false;
  res.json({ isFollowing });
});

// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  const notifications = await getData('notifications');
  const userNotifications = Object.entries(notifications || {})
    .map(([id, notification]) => ({ ...notification, id }))
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(userNotifications);
});

// Mark notification as read
app.put('/api/notifications/read/:notificationId', async (req, res) => {
  const { notificationId } = req.params;
  await updateData(`notifications/${notificationId}`, { isRead: true });
  res.json({ success: true });
});

// Share note
app.post('/api/notes/share/:noteId', async (req, res) => {
  const { noteId } = req.params;
  const { userId, sharedWithId } = req.body;
  
  if (!userId || !sharedWithId) {
    return res.status(400).json({ error: 'userId and sharedWithId are required' });
  }
  
  const note = await getData(`notes/${noteId}`);
  const sharedWith = await getData(`users/${sharedWithId}`);
  
  if (!note || !sharedWith) {
    return res.status(404).json({ error: 'Note or user not found' });
  }
  
  // Create notification
  await createNotification('share', sharedWithId, userId, noteId);
  
  res.json({ success: true });
});

// Get user stats
app.get('/api/users/stats/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Get all notes
  const notes = await getData('notes');
  const userNotes = Object.values(notes || {}).filter(n => n.userId === userId);
  const publicNotes = userNotes.filter(n => n.isPublic);
  
  // Get bookmarks count
  const bookmarks = await getData('bookmarks');
  const userBookmarks = Object.values(bookmarks || {}).filter(b => b.userId === userId).length;
  
  // Calculate total views and likes
  const views = await getData('views');
  const likes = await getData('likes');
  
  let totalViews = 0;
  let totalLikes = 0;
  
  userNotes.forEach(note => {
    totalViews += Object.values(views || {}).filter(v => v.noteId === note.id).length;
    totalLikes += Object.values(likes || {}).filter(l => l.noteId === note.id).length;
  });
  
  // Get user data for followers/following count
  const user = await getData(`users/${userId}`);
  
  res.json({
    totalNotes: userNotes.length,
    totalPublicNotes: publicNotes.length,
    totalBookmarks: userBookmarks,
    totalViews,
    totalLikes,
    followers: user?.followers?.length || 0,
    following: user?.following?.length || 0
  });
});

// Admin endpoints
app.post('/api/admin/login', isAdmin, async (req, res) => {
  const adminData = await getData('admin');
  res.json({ 
    success: true,
    admin: {
      id: adminData.id,
      email: adminData.email
    }
  });
});

app.get('/api/admin/users', async (req, res) => {
  const users = await getData('users');
  const notes = await getData('notes');
  
  const usersList = Object.entries(users || {}).map(([id, user]) => {
    const userNotes = Object.values(notes || {}).filter(n => n.userId === id);
    return {
      id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      isSuspended: user.isSuspended || false,
      notesCount: userNotes.length
    };
  });
  
  res.json(usersList);
});

app.put('/api/admin/users/suspend/:userId', async (req, res) => {
  const { userId } = req.params;
  const { suspend } = req.body;
  
  const user = await getData(`users/${userId}`);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  await updateData(`users/${userId}`, { isSuspended: suspend });
  res.json({ success: true, isSuspended: suspend });
});

app.delete('/api/admin/notes/:noteId', async (req, res) => {
  const { noteId } = req.params;
  
  // Remove note
  await removeData(`notes/${noteId}`);
  
  // Remove related data
  const comments = await getData('comments');
  const likes = await getData('likes');
  const bookmarks = await getData('bookmarks');
  const views = await getData('views');
  
  // Remove related comments
  const commentKeys = Object.keys(comments || {}).filter(key => comments[key].noteId === noteId);
  await Promise.all(commentKeys.map(key => removeData(`comments/${key}`)));
  
  // Remove related likes
  const likeKeys = Object.keys(likes || {}).filter(key => likes[key].noteId === noteId);
  await Promise.all(likeKeys.map(key => removeData(`likes/${key}`)));
  
  // Remove related bookmarks
  const bookmarkKeys = Object.keys(bookmarks || {}).filter(key => bookmarks[key].noteId === noteId);
  await Promise.all(bookmarkKeys.map(key => removeData(`bookmarks/${key}`)));
  
  // Remove related views
  const viewKeys = Object.keys(views || {}).filter(key => views[key].noteId === noteId);
  await Promise.all(viewKeys.map(key => removeData(`views/${key}`)));
  
  res.json({ success: true });
});

// API Endpoints for users
app.get('/api/users', async (req, res) => {
  const users = await getData('users');
  res.json(Object.values(users || {}));
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const user = await getData(`users/${id}`);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    createdAt: user.createdAt,
    isSuspended: user.isSuspended || false
  });
});

// API Endpoints for notes
app.get('/api/notes/public', async (req, res) => {
  const notes = await getData('notes');
  const users = await getData('users');
  
  const publicNotes = Object.entries(notes || {})
    .map(([id, note]) => ({ ...note, id }))
    .filter(note => note.isPublic && !users[note.userId]?.isSuspended);
  
  // Add stats to each note
  const views = await getData('views');
  const likes = await getData('likes');
  const comments = await getData('comments');
  
  const notesWithStats = publicNotes.map(note => {
    const noteViews = Object.values(views || {}).filter(v => v.noteId === note.id).length;
    const noteLikes = Object.values(likes || {}).filter(l => l.noteId === note.id).length;
    const noteComments = Object.values(comments || {}).filter(c => c.noteId === note.id).length;
    
    return {
      ...note,
      views: noteViews,
      likes: noteLikes,
      comments: noteComments
    };
  });
  
  res.json(notesWithStats);
});

app.get('/api/notes/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const notes = await getData('notes');
  
  const userNotes = Object.entries(notes || {})
    .map(([id, note]) => ({ ...note, id }))
    .filter(note => note.userId === userId);
  
  // Add stats to each note
  const views = await getData('views');
  const likes = await getData('likes');
  const comments = await getData('comments');
  
  const notesWithStats = userNotes.map(note => {
    const noteViews = Object.values(views || {}).filter(v => v.noteId === note.id).length;
    const noteLikes = Object.values(likes || {}).filter(l => l.noteId === note.id).length;
    const noteComments = Object.values(comments || {}).filter(c => c.noteId === note.id).length;
    
    return {
      ...note,
      views: noteViews,
      likes: noteLikes,
      comments: noteComments
    };
  });
  
  res.json(notesWithStats);
});

app.post('/api/notes', upload.single('image'), async (req, res) => {
  const { title, content, userId, isPublic } = req.body;
  const image = req.file;
  
  if (!title || !content || !userId) {
    return res.status(400).json({ error: 'Title, content, and userId are required' });
  }

  const newNote = {
    title,
    content,
    userId,
    isPublic: !!isPublic,
    image: image ? `/assets/${image.filename}` : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const noteId = await pushData('notes', newNote);
  res.status(201).json({ ...newNote, id: noteId });
});

app.put('/api/notes/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, content, isPublic, removeImage } = req.body;
  const image = req.file;

  const note = await getData(`notes/${id}`);

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const updatedNote = {
    ...note,
    title: title || note.title,
    content: content || note.content,
    isPublic: isPublic !== undefined ? isPublic : note.isPublic,
    image: image ? `/assets/${image.filename}` : 
           removeImage === 'true' ? null : note.image,
    updatedAt: new Date().toISOString()
  };

  await setData(`notes/${id}`, updatedNote);
  res.json(updatedNote);
});

app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;

  const note = await getData(`notes/${id}`);

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  // Remove related data
  const comments = await getData('comments');
  const likes = await getData('likes');
  const bookmarks = await getData('bookmarks');
  const views = await getData('views');

  // Remove related comments
  const commentKeys = Object.keys(comments || {}).filter(key => comments[key].noteId === id);
  await Promise.all(commentKeys.map(key => removeData(`comments/${key}`)));

  // Remove related likes
  const likeKeys = Object.keys(likes || {}).filter(key => likes[key].noteId === id);
  await Promise.all(likeKeys.map(key => removeData(`likes/${key}`)));

  // Remove related bookmarks
  const bookmarkKeys = Object.keys(bookmarks || {}).filter(key => bookmarks[key].noteId === id);
  await Promise.all(bookmarkKeys.map(key => removeData(`bookmarks/${key}`)));

  // Remove related views
  const viewKeys = Object.keys(views || {}).filter(key => views[key].noteId === id);
  await Promise.all(viewKeys.map(key => removeData(`views/${key}`)));

  // Finally remove the note
  await removeData(`notes/${id}`);
  res.json({ message: 'Note deleted successfully' });
});

// Auth endpoints
app.post('/api/register', async (req, res) => {
  const { name, email, password, bio } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const users = await getData('users');
  
  // Check if email already exists (case insensitive)
  const emailExists = Object.values(users || {}).some(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    bio: bio || '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4a6fa5&color=fff`,
    createdAt: new Date().toISOString(),
    isSuspended: false,
    followers: [],
    following: []
  };

  const userId = await pushData('users', newUser);
  
  // Don't return password hash
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ ...userWithoutPassword, id: userId });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = await getData('users');
  const user = Object.values(users || {}).find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: 'Account suspended. Please contact admin.' });
  }

  // Don't return password hash
  const { password: _, ...userWithoutPassword } = user;
  res.json({ ...userWithoutPassword, id: Object.keys(users).find(key => users[key].email === user.email) });
});

app.put('/api/users/:id', upload.single('avatar'), async (req, res) => {
  const { id } = req.params;
  const { name, bio, removeAvatar } = req.body;
  const avatar = req.file;

  const user = await getData(`users/${id}`);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updatedUser = {
    ...user,
    name: name || user.name,
    bio: bio !== undefined ? bio : user.bio,
    avatar: avatar ? `/assets/${avatar.filename}` : 
           removeAvatar === 'true' ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user.name)}&background=4a6fa5&color=fff` : 
           user.avatar
  };

  await setData(`users/${id}`, updatedUser);

  // Don't return password hash
  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json({ ...userWithoutPassword, id });
});

// Run server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});