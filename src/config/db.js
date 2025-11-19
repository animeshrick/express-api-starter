const { MongoClient } = require("mongodb");
const redisHelper = require("../helper/redis.helper");

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

if (!uri) {
  console.error("❌ MONGO_URL is missing in .env");
  process.exit(1);
}

const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB Connected!");
    await redisHelper.connect();

    // console.log("All redis keys:", await redisHelper.keys());

    db = client.db(dbName);
    return db;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

function getDB() {
  if (!db) throw new Error("DB not connected");
  return db;
}



module.exports = { connectDB, getDB };
