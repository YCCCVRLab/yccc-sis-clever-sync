const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../data');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const ENROLLMENTS_FILE = path.join(DATA_DIR, 'enrollments.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load classes from file
async function loadClasses() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CLASSES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save classes to file
async function saveClasses(classes) {
  await ensureDataDir();
  await fs.writeFile(CLASSES_FILE, JSON.stringify(classes, null, 2));
}

// Load enrollments from file
async function loadEnrollments() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(ENROLLMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save enrollments to file
async function saveEnrollments(enrollments) {
  await ensureDataDir();
  await fs.writeFile(ENROLLMENTS_FILE, JSON.stringify(enrollments, null, 2));
}

// Get all classes
async function getAllClasses() {
  return await loadClasses();
}

// Get class by ID
async function getClassById(id) {
  const classes = await loadClasses();
  return classes.find(cls => cls.id === id);
}

// Get class count
async function getClassCount() {
  const classes = await loadClasses();
  return classes.length;
}

// Create new class
async function createClass(classData) {
  const classes = await loadClasses();
  
  // Validate required fields
  if (!classData.name || !classData.course_code) {
    throw new Error('Missing required fields: name, course_code');
  }
  
  // Check for duplicate course_code
  if (classes.find(cls => cls.course_code === classData.course_code)) {
    throw new Error('Class with this course_code already exists');
  }
  
  const newClass = {
    id: uuidv4(),
    name: classData.name,
    course_code: classData.course_code,
    description: classData.description || '',
    instructor: classData.instructor || '',
    schedule: classData.schedule || '',
    room: classData.room || '',
    capacity: parseInt(classData.capacity) || 30,
    status: classData.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  classes.push(newClass);
  await saveClasses(classes);
  
  return newClass;
}

// Update class
async function updateClass(id, updateData) {
  const classes = await loadClasses();
  const classIndex = classes.findIndex(cls => cls.id === id);
  
  if (classIndex === -1) {
    return null;
  }
  
  // Check for duplicate course_code if it's being updated
  if (updateData.course_code && updateData.course_code !== classes[classIndex].course_code) {
    if (classes.find(cls => cls.course_code === updateData.course_code)) {
      throw new Error('Class with this course_code already exists');
    }
  }
  
  classes[classIndex] = {
    ...classes[classIndex],
    ...updateData,
    updated_at: new Date().toISOString()
  };
  
  await saveClasses(classes);
  return classes[classIndex];
}

// Delete class
async function deleteClass(id) {
  const classes = await loadClasses();
  const classIndex = classes.findIndex(cls => cls.id === id);
  
  if (classIndex === -1) {
    return false;
  }
  
  // Also remove all enrollments for this class
  const enrollments = await loadEnrollments();
  const updatedEnrollments = enrollments.filter(enrollment => enrollment.class_id !== id);
  await saveEnrollments(updatedEnrollments);
  
  classes.splice(classIndex, 1);
  await saveClasses(classes);
  
  return true;
}

// Get class enrollments
async function getClassEnrollments(classId) {
  const enrollments = await loadEnrollments();
  return enrollments.filter(enrollment => enrollment.class_id === classId);
}

// Add student to class
async function addStudentToClass(classId, studentId) {
  const enrollments = await loadEnrollments();
  
  // Check if enrollment already exists
  if (enrollments.find(e => e.class_id === classId && e.student_id === studentId)) {
    throw new Error('Student is already enrolled in this class');
  }
  
  const newEnrollment = {
    id: uuidv4(),
    class_id: classId,
    student_id: studentId,
    enrolled_at: new Date().toISOString(),
    status: 'active'
  };
  
  enrollments.push(newEnrollment);
  await saveEnrollments(enrollments);
  
  return newEnrollment;
}

// Remove student from class
async function removeStudentFromClass(classId, studentId) {
  const enrollments = await loadEnrollments();
  const enrollmentIndex = enrollments.findIndex(e => e.class_id === classId && e.student_id === studentId);
  
  if (enrollmentIndex === -1) {
    return false;
  }
  
  enrollments.splice(enrollmentIndex, 1);
  await saveEnrollments(enrollments);
  
  return true;
}

module.exports = {
  getAllClasses,
  getClassById,
  getClassCount,
  createClass,
  updateClass,
  deleteClass,
  getClassEnrollments,
  addStudentToClass,
  removeStudentFromClass
};