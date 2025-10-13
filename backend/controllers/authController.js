const User = require('../models/User');
const { formatResponse, generateToken } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * User registration
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json(
        formatResponse(false, null, 'User with this email already exists')
      );
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json(
        formatResponse(false, null, 'Username already taken')
      );
    }

    // Create user
    const userId = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user'
    });

    const newUser = await User.findById(userId);
    
    // Generate JWT token
    const token = generateToken({
      userId: newUser.userId,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });

    logger.info(`User registered: ${email}`);

    res.status(201).json(
      formatResponse(true, {
        user: newUser,
        token
      }, 'User registered successfully')
    );
  } catch (error) {
    logger.error('Error in register:', error);
    next(error);
  }
};

/**
 * User login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verify user credentials
    const user = await User.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json(
        formatResponse(false, null, 'Invalid email or password')
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role
    });

    logger.info(`User logged in: ${email}`);

    res.status(200).json(
      formatResponse(true, {
        user,
        token
      }, 'Login successful')
    );
  } catch (error) {
    logger.error('Error in login:', error);
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json(
        formatResponse(false, null, 'User not found')
      );
    }

    res.status(200).json(
      formatResponse(true, user, 'Profile retrieved successfully')
    );
  } catch (error) {
    logger.error('Error in getProfile:', error);
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.userId;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.userId !== userId) {
        return res.status(400).json(
          formatResponse(false, null, 'Email already in use')
        );
      }
    }

    const success = await User.update(userId, {
      firstName,
      lastName,
      email
    });

    if (!success) {
      return res.status(400).json(
        formatResponse(false, null, 'Failed to update profile')
      );
    }

    const updatedUser = await User.findById(userId);

    logger.info(`Profile updated: ${req.user.email}`);

    res.status(200).json(
      formatResponse(true, updatedUser, 'Profile updated successfully')
    );
  } catch (error) {
    logger.error('Error in updateProfile:', error);
    next(error);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Verify current password
    const user = await User.verifyPassword(req.user.email, currentPassword);
    if (!user) {
      return res.status(400).json(
        formatResponse(false, null, 'Current password is incorrect')
      );
    }

    // Update password
    const success = await User.update(userId, {
      password: newPassword
    });

    if (!success) {
      return res.status(400).json(
        formatResponse(false, null, 'Failed to change password')
      );
    }

    logger.info(`Password changed: ${req.user.email}`);

    res.status(200).json(
      formatResponse(true, null, 'Password changed successfully')
    );
  } catch (error) {
    logger.error('Error in changePassword:', error);
    next(error);
  }
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await User.findAll(page, limit);

    res.status(200).json(
      formatResponse(true, result.users, 'Users retrieved successfully', {
        pagination: result.pagination
      })
    );
  } catch (error) {
    logger.error('Error in getAllUsers:', error);
    next(error);
  }
};

/**
 * Delete user (admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json(
        formatResponse(false, null, 'Cannot delete your own account')
      );
    }

    const success = await User.delete(userId);
    if (!success) {
      return res.status(404).json(
        formatResponse(false, null, 'User not found')
      );
    }

    logger.info(`User deleted: ${userId} by admin ${req.user.userId}`);

    res.status(200).json(
      formatResponse(true, null, 'User deleted successfully')
    );
  } catch (error) {
    logger.error('Error in deleteUser:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  deleteUser
};