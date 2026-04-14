'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('users', [
      {
        id: 999, // الـ ID الثابت اللي اتفقنا عليه
        email: 'shelby-bot@ai.com',
        password: '123456789', // كلمة سر وهمية مش هتستخدم
        role: 'admin', // أو ضيفي 'assistant' في الـ ENUM لو تحبي
        avatar: 'https://path-to-your-shelby-logo.png', // حطي لينك صورة شلبي
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', { id: 999 }, {});
  },
};