'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Temporarily disable foreign key checks to allow deletion
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete existing users
    await queryInterface.bulkDelete('users', null, {});
    
    // Re-enable foreign key checks
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        email: 'user1@example.com',
        password: hashedPassword,
        firstName: 'مستخدم',
        lastName: 'تجريبي',
        phone: '01001234567',
        role: 'user',
        isActive: true,
        totalOrders: 0,
        favoriteStores: 0,
        rating: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        email: 'storeowner1@example.com',
        password: hashedPassword,
        firstName: 'صاحب',
        lastName: 'متجر',
        phone: '01009876543',
        role: 'store_owner',
        isActive: true,
        totalOrders: 0,
        favoriteStores: 0,
        rating: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        email: 'storeowner2@example.com',
        password: hashedPassword,
        firstName: 'صاحب',
        lastName: 'متجر 2',
        phone: '01005556677',
        role: 'store_owner',
        isActive: true,
        totalOrders: 0,
        favoriteStores: 0,
        rating: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        email: 'storeowner3@example.com',
        password: hashedPassword,
        firstName: 'صاحب',
        lastName: 'متجر 3',
        phone: '01008889900',
        role: 'store_owner',
        isActive: true,
        totalOrders: 0,
        favoriteStores: 0,
        rating: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        email: 'storeowner4@example.com',
        password: hashedPassword,
        firstName: 'صاحب',
        lastName: 'متجر 4',
        phone: '01001112233',
        role: 'store_owner',
        isActive: true,
        totalOrders: 0,
        favoriteStores: 0,
        rating: 0.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};

