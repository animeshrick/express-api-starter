require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");

const hostname = '127.0.0.1';
const port = 3000;

async function startServer() {
  await connectDB();
  
  app.listen(port, () => {
    console.log(`Onion_Server running at http://${hostname}:${port}/`);
  });
}

startServer();
