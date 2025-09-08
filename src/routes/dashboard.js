const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const classService = require('../services/classService');
const syncService = require('../services/syncService');

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Login page (public)
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.render('login', { title: 'Login - YCCC Clever SIS', error: null });
  }
});

// Dashboard (protected)
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const stats = {
      totalUsers: await userService.getUserCount(),
      totalClasses: await classService.getClassCount(),
      lastSync: await syncService.getLastSyncTime(),
      syncStatus: await syncService.getSyncStatus()
    };
    
    res.render('dashboard', {
      title: 'Dashboard - YCCC Clever SIS',
      user: req.session.user,
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', {
      title: 'Dashboard - YCCC Clever SIS',
      user: req.session.user,
      stats: {
        totalUsers: 0,
        totalClasses: 0,
        lastSync: null,
        syncStatus: 'error'
      }
    });
  }
});

// Users management page
router.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.render('users', {
      title: 'Users - YCCC Clever SIS',
      user: req.session.user,
      users
    });
  } catch (error) {
    console.error('Users page error:', error);
    res.render('users', {
      title: 'Users - YCCC Clever SIS',
      user: req.session.user,
      users: [],
      error: 'Failed to load users'
    });
  }
});

// Classes management page
router.get('/classes', requireAuth, async (req, res) => {
  try {
    const classes = await classService.getAllClasses();
    res.render('classes', {
      title: 'Classes - YCCC Clever SIS',
      user: req.session.user,
      classes
    });
  } catch (error) {
    console.error('Classes page error:', error);
    res.render('classes', {
      title: 'Classes - YCCC Clever SIS',
      user: req.session.user,
      classes: [],
      error: 'Failed to load classes'
    });
  }
});

// Sync page
router.get('/sync', requireAuth, async (req, res) => {
  try {
    const syncHistory = await syncService.getSyncHistory();
    const syncStatus = await syncService.getSyncStatus();
    
    res.render('sync', {
      title: 'Sync - YCCC Clever SIS',
      user: req.session.user,
      syncHistory,
      syncStatus
    });
  } catch (error) {
    console.error('Sync page error:', error);
    res.render('sync', {
      title: 'Sync - YCCC Clever SIS',
      user: req.session.user,
      syncHistory: [],
      syncStatus: 'error',
      error: 'Failed to load sync data'
    });
  }
});

module.exports = router;