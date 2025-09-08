const express = require('express');
const router = express.Router();
const syncService = require('../services/syncService');

// Get sync status
router.get('/status', async (req, res) => {
  try {
    const status = await syncService.getSyncStatus();
    res.json(status);
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Get sync history
router.get('/history', async (req, res) => {
  try {
    const history = await syncService.getSyncHistory();
    res.json(history);
  } catch (error) {
    console.error('Get sync history error:', error);
    res.status(500).json({ error: 'Failed to get sync history' });
  }
});

// Trigger manual sync
router.post('/trigger', async (req, res) => {
  try {
    const result = await syncService.triggerSync();
    res.json(result);
  } catch (error) {
    console.error('Trigger sync error:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

// Upload CSV files
router.post('/upload', async (req, res) => {
  try {
    const result = await syncService.uploadToClever();
    res.json(result);
  } catch (error) {
    console.error('Upload sync error:', error);
    res.status(500).json({ error: 'Failed to upload to Clever' });
  }
});

// Download from Clever
router.post('/download', async (req, res) => {
  try {
    const result = await syncService.downloadFromClever();
    res.json(result);
  } catch (error) {
    console.error('Download sync error:', error);
    res.status(500).json({ error: 'Failed to download from Clever' });
  }
});

// Test SFTP connection
router.get('/test-connection', async (req, res) => {
  try {
    const result = await syncService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: 'Connection test failed' });
  }
});

module.exports = router;