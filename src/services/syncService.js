const fs = require('fs').promises;
const path = require('path');
const SftpClient = require('ssh2-sftp-client');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const userService = require('./userService');
const classService = require('./classService');

const DATA_DIR = path.join(__dirname, '../../data');
const SYNC_LOG_FILE = path.join(DATA_DIR, 'sync_log.json');
const CSV_DIR = path.join(DATA_DIR, 'csv');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  
  try {
    await fs.access(CSV_DIR);
  } catch {
    await fs.mkdir(CSV_DIR, { recursive: true });
  }
}

// Load sync log
async function loadSyncLog() {
  await ensureDirectories();
  try {
    const data = await fs.readFile(SYNC_LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save sync log
async function saveSyncLog(log) {
  await ensureDirectories();
  await fs.writeFile(SYNC_LOG_FILE, JSON.stringify(log, null, 2));
}

// Add sync log entry
async function addSyncLogEntry(entry) {
  const log = await loadSyncLog();
  log.unshift({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...entry
  });
  
  // Keep only last 100 entries
  if (log.length > 100) {
    log.splice(100);
  }
  
  await saveSyncLog(log);
}

// Get sync status
async function getSyncStatus() {
  const log = await loadSyncLog();
  if (log.length === 0) {
    return { status: 'never', message: 'No sync has been performed yet' };
  }
  
  const lastSync = log[0];
  return {
    status: lastSync.status,
    message: lastSync.message,
    timestamp: lastSync.timestamp
  };
}

// Get sync history
async function getSyncHistory() {
  return await loadSyncLog();
}

// Get last sync time
async function getLastSyncTime() {
  const log = await loadSyncLog();
  return log.length > 0 ? log[0].timestamp : null;
}

// Test SFTP connection
async function testConnection() {
  const sftp = new SftpClient();
  
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: parseInt(process.env.SFTP_PORT) || 22,
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD
    });
    
    await sftp.end();
    
    await addSyncLogEntry({
      type: 'connection_test',
      status: 'success',
      message: 'SFTP connection test successful'
    });
    
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    await addSyncLogEntry({
      type: 'connection_test',
      status: 'error',
      message: `SFTP connection failed: ${error.message}`
    });
    
    throw new Error(`Connection failed: ${error.message}`);
  }
}

// Generate CSV files
async function generateCsvFiles() {
  await ensureDirectories();
  
  // Generate users CSV
  const users = await userService.getAllUsers();
  const usersCsvWriter = createCsvWriter({
    path: path.join(CSV_DIR, 'students.csv'),
    header: [
      { id: 'student_id', title: 'Student_id' },
      { id: 'first_name', title: 'First_name' },
      { id: 'last_name', title: 'Last_name' },
      { id: 'email', title: 'Email' },
      { id: 'grade', title: 'Grade' },
      { id: 'status', title: 'Status' }
    ]
  });
  
  await usersCsvWriter.writeRecords(users);
  
  // Generate classes CSV
  const classes = await classService.getAllClasses();
  const classesCsvWriter = createCsvWriter({
    path: path.join(CSV_DIR, 'sections.csv'),
    header: [
      { id: 'course_code', title: 'Course_number' },
      { id: 'name', title: 'Course_name' },
      { id: 'instructor', title: 'Teacher_email' },
      { id: 'schedule', title: 'Period' },
      { id: 'room', title: 'Section_id' }
    ]
  });
  
  await classesCsvWriter.writeRecords(classes);
  
  // Generate enrollments CSV
  const enrollments = [];
  for (const cls of classes) {
    const classEnrollments = await classService.getClassEnrollments(cls.id);
    for (const enrollment of classEnrollments) {
      enrollments.push({
        section_id: cls.room || cls.course_code,
        student_id: enrollment.student_id
      });
    }
  }
  
  const enrollmentsCsvWriter = createCsvWriter({
    path: path.join(CSV_DIR, 'enrollments.csv'),
    header: [
      { id: 'section_id', title: 'Section_id' },
      { id: 'student_id', title: 'Student_id' }
    ]
  });
  
  await enrollmentsCsvWriter.writeRecords(enrollments);
  
  return {
    students: path.join(CSV_DIR, 'students.csv'),
    sections: path.join(CSV_DIR, 'sections.csv'),
    enrollments: path.join(CSV_DIR, 'enrollments.csv')
  };
}

// Upload to Clever via SFTP
async function uploadToClever() {
  const sftp = new SftpClient();
  
  try {
    // Generate CSV files
    const csvFiles = await generateCsvFiles();
    
    // Connect to SFTP
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: parseInt(process.env.SFTP_PORT) || 22,
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD
    });
    
    // Upload files
    for (const [type, localPath] of Object.entries(csvFiles)) {
      const remotePath = `/${type}.csv`;
      await sftp.put(localPath, remotePath);
    }
    
    await sftp.end();
    
    await addSyncLogEntry({
      type: 'upload',
      status: 'success',
      message: 'Successfully uploaded CSV files to Clever',
      files_uploaded: Object.keys(csvFiles)
    });
    
    return { success: true, message: 'Upload successful', files: Object.keys(csvFiles) };
  } catch (error) {
    await addSyncLogEntry({
      type: 'upload',
      status: 'error',
      message: `Upload failed: ${error.message}`
    });
    
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Download from Clever via SFTP
async function downloadFromClever() {
  const sftp = new SftpClient();
  
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: parseInt(process.env.SFTP_PORT) || 22,
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD
    });
    
    // List available files
    const files = await sftp.list('/');
    const csvFiles = files.filter(file => file.name.endsWith('.csv'));
    
    const downloadedFiles = [];
    
    // Download each CSV file
    for (const file of csvFiles) {
      const localPath = path.join(CSV_DIR, `downloaded_${file.name}`);
      await sftp.get(`/${file.name}`, localPath);
      downloadedFiles.push(file.name);
    }
    
    await sftp.end();
    
    await addSyncLogEntry({
      type: 'download',
      status: 'success',
      message: 'Successfully downloaded files from Clever',
      files_downloaded: downloadedFiles
    });
    
    return { success: true, message: 'Download successful', files: downloadedFiles };
  } catch (error) {
    await addSyncLogEntry({
      type: 'download',
      status: 'error',
      message: `Download failed: ${error.message}`
    });
    
    throw new Error(`Download failed: ${error.message}`);
  }
}

// Trigger full sync
async function triggerSync() {
  try {
    await addSyncLogEntry({
      type: 'sync_start',
      status: 'in_progress',
      message: 'Starting full sync process'
    });
    
    // Test connection first
    await testConnection();
    
    // Upload current data
    const uploadResult = await uploadToClever();
    
    await addSyncLogEntry({
      type: 'sync_complete',
      status: 'success',
      message: 'Full sync completed successfully',
      details: uploadResult
    });
    
    return { success: true, message: 'Sync completed successfully' };
  } catch (error) {
    await addSyncLogEntry({
      type: 'sync_complete',
      status: 'error',
      message: `Sync failed: ${error.message}`
    });
    
    throw error;
  }
}

module.exports = {
  getSyncStatus,
  getSyncHistory,
  getLastSyncTime,
  testConnection,
  uploadToClever,
  downloadFromClever,
  triggerSync
};