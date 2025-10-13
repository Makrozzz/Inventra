const { executeQuery } = require('../config/database');
const { hashPassword, comparePassword, toCamelCase } = require('../utils/helpers');

class User {
  constructor(data) {
    this.userId = data.user_id || data.userId;
    this.username = data.username;
    this.email = data.email;
    this.firstName = data.first_name || data.firstName;
    this.lastName = data.last_name || data.lastName;
    this.role = data.role || 'user';
    this.isActive = data.is_active || data.isActive;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Create new user
  static async create(userData) {
    const hashedPassword = await hashPassword(userData.password);
    
    const query = `
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, role, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userData.username,
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.role || 'user',
      userData.isActive !== undefined ? userData.isActive : true
    ];

    const result = await executeQuery(query, values);
    return result.insertId;
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
    const result = await executeQuery(query, [email]);
    return result.length > 0 ? toCamelCase(result[0]) : null;
  }

  // Find user by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ? AND is_active = 1';
    const result = await executeQuery(query, [username]);
    return result.length > 0 ? toCamelCase(result[0]) : null;
  }

  // Find user by ID
  static async findById(userId) {
    const query = 'SELECT * FROM users WHERE user_id = ? AND is_active = 1';
    const result = await executeQuery(query, [userId]);
    return result.length > 0 ? toCamelCase(result[0]) : null;
  }

  // Verify user password
  static async verifyPassword(email, password) {
    const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
    const result = await executeQuery(query, [email]);
    
    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    const isPasswordValid = await comparePassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return toCamelCase(userWithoutPassword);
  }

  // Update user
  static async update(userId, updateData) {
    const fields = [];
    const values = [];

    // Handle password update separately
    if (updateData.password) {
      updateData.passwordHash = await hashPassword(updateData.password);
      delete updateData.password;
    }

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'userId') {
        // Convert camelCase to snake_case for database
        const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${dbField} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
    
    const result = await executeQuery(query, values);
    return result.affectedRows > 0;
  }

  // Soft delete user
  static async delete(userId) {
    const query = 'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
    const result = await executeQuery(query, [userId]);
    return result.affectedRows > 0;
  }

  // Get all users
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = 1';
    const countResult = await executeQuery(countQuery);
    const totalCount = countResult[0].total;

    // Get paginated results without password hashes
    const dataQuery = `
      SELECT user_id, username, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const users = await executeQuery(dataQuery, [limit, offset]);
    
    return {
      users: toCamelCase(users),
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    };
  }
}

module.exports = User;