// Import Prisma Client, a JS library to interact with sql using JS
const { PrismaClient } = require('@prisma/client')

// Initialize PrismaClient
const prisma = new PrismaClient();

// Export PrismaClient instance
module.exports = prisma;
