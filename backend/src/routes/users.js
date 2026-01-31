const express = require('express');
const { User } = require('../models');

const router = express.Router();

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'user')) {
      return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user"' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from removing their own admin role
    if (user.id === req.user.id && role === 'user') {
      return res.status(400).json({ error: 'You cannot remove your own admin role' });
    }

    user.role = role;
    await user.save();

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete yourself' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;