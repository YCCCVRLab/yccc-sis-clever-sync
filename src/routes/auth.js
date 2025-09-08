const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Simple user store (replace with database in production)
const users = [
  {
    id: 1,
    username: process.env.ADMIN_USERNAME || 'admin',
    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
    role: 'admin'
  }
];

// Login page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login - YCCC Clever SIS', error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    res.redirect('/dashboard');
  } else {
    res.render('login', {
      title: 'Login - YCCC Clever SIS',
      error: 'Invalid username or password'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/login');
  });
});

// Change password
router.post('/change-password', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { currentPassword, newPassword } = req.body;
  const user = users.find(u => u.id === req.session.user.id);
  
  if (user && await bcrypt.compare(currentPassword, user.password)) {
    user.password = await bcrypt.hash(newPassword, 10);
    res.json({ success: true, message: 'Password changed successfully' });
  } else {
    res.status(400).json({ error: 'Current password is incorrect' });
  }
});

module.exports = router;