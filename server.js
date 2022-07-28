const http = require('http');
require('dotenv').config();

const app = require('./app');
const startMongoDB = require('./mongodb');

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

async function startServer() {
  try {
    await startMongoDB(server);
    server.listen(PORT, () =>
      console.log(`🚀🚀🚀 Server Running On http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error(error);
  }
}

startServer();
