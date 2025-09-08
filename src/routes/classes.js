const express = require('express');
const router = express.Router();
const classService = require('../services/classService');

// Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await classService.getAllClasses();
    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const classData = await classService.getClassById(req.params.id);
    if (classData) {
      res.json(classData);
    } else {
      res.status(404).json({ error: 'Class not found' });
    }
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// Create new class
router.post('/', async (req, res) => {
  try {
    const classData = req.body;
    const newClass = await classService.createClass(classData);
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(400).json({ error: error.message || 'Failed to create class' });
  }
});

// Update class
router.put('/:id', async (req, res) => {
  try {
    const updatedClass = await classService.updateClass(req.params.id, req.body);
    if (updatedClass) {
      res.json(updatedClass);
    } else {
      res.status(404).json({ error: 'Class not found' });
    }
  } catch (error) {
    console.error('Update class error:', error);
    res.status(400).json({ error: error.message || 'Failed to update class' });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await classService.deleteClass(req.params.id);
    if (deleted) {
      res.json({ message: 'Class deleted successfully' });
    } else {
      res.status(404).json({ error: 'Class not found' });
    }
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// Get class enrollments
router.get('/:id/enrollments', async (req, res) => {
  try {
    const enrollments = await classService.getClassEnrollments(req.params.id);
    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Add student to class
router.post('/:id/enrollments', async (req, res) => {
  try {
    const { studentId } = req.body;
    const enrollment = await classService.addStudentToClass(req.params.id, studentId);
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Add enrollment error:', error);
    res.status(400).json({ error: error.message || 'Failed to add student to class' });
  }
});

// Remove student from class
router.delete('/:id/enrollments/:studentId', async (req, res) => {
  try {
    const removed = await classService.removeStudentFromClass(req.params.id, req.params.studentId);
    if (removed) {
      res.json({ message: 'Student removed from class successfully' });
    } else {
      res.status(404).json({ error: 'Enrollment not found' });
    }
  } catch (error) {
    console.error('Remove enrollment error:', error);
    res.status(500).json({ error: 'Failed to remove student from class' });
  }
});

module.exports = router;