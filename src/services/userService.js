const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load users from file
async function loadUsers() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save users to file
async function saveUsers(users) {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Get all users
async function getAllUsers() {
  return await loadUsers();
}

// Get user by ID
async function getUserById(id) {
  const users = await loadUsers();
  return users.find(user => user.id === id);
}

// Get user count
async function getUserCount() {
  const users = await loadUsers();
  return users.length;
}

// Create new user
async function createUser(userData) {
  const users = await loadUsers();
  
  // Validate required fields
  if (!userData.student_id || !userData.first_name || !userData.last_name) {
    throw new Error('Missing required fields: student_id, first_name, last_name');
  }
  
  // Check for duplicate student_id
  if (users.find(user => user.student_id === userData.student_id)) {
    throw new Error('User with this student_id already exists');
  }
  
  const newUser = {
    id: uuidv4(),
    student_id: userData.student_id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    email: userData.email || '',
    grade: userData.grade || '',
    status: userData.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  users.push(newUser);
  await saveUsers(users);
  
  return newUser;
}

// Update user
async function updateUser(id, updateData) {
  const users = await loadUsers();
  const userIndex = users.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return null;
  }
  
  // Check for duplicate student_id if it's being updated
  if (updateData.student_id && updateData.student_id !== users[userIndex].student_id) {
    if (users.find(user => user.student_id === updateData.student_id)) {
      throw new Error('User with this student_id already exists');
    }
  }
  
  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
    updated_at: new Date().toISOString()
  };
  
  await saveUsers(users);
  return users[userIndex];
}

// Delete user
async function deleteUser(id) {
  const users = await loadUsers();
  const userIndex = users.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return false;
  }
  
  users.splice(userIndex, 1);
  await saveUsers(users);
  
  return true;
}

// Search users
async function searchUsers(query) {
  const users = await loadUsers();
  const searchTerm = query.toLowerCase();
  
  return users.filter(user => 
    user.first_name.toLowerCase().includes(searchTerm) ||
    user.last_name.toLowerCase().includes(searchTerm) ||
    user.student_id.toLowerCase().includes(searchTerm) ||
    (user.email && user.email.toLowerCase().includes(searchTerm))
  );
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserCount,
  createUser,
  updateUser,
  deleteUser,
  searchUsers
};