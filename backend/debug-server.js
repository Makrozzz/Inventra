// Wrapper to catch any startup errors
console.log('🔍 Starting server with debugging...');

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

try {
  console.log('📦 Loading server.js...');
  require('./server.js');
  console.log('✅ Server.js loaded successfully');
} catch (error) {
  console.error('❌ Error loading server.js:', error.message);
  console.error(error.stack);
  process.exit(1);
}
