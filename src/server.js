require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");

const hostname = process.env.HOST_NAME;
const port = process.env.PORT;

async function startServer() {
  await connectDB();
  
  app.listen(port, () => {
    console.log(`Onion_Server running at http://${hostname}:${port}/`);
  });
}

startServer();
