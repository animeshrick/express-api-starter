const redis = require('redis');
require('dotenv').config();

class RedisHelper {
    constructor() {
        this.client = null;
    }

    async connect() {
        if (this.client) {
            return this.client;
        }

        try {
            const url = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

            this.client = redis.createClient({
                url,
                socket: {
                    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
                },
            });

            this.client.on('error', (err) => console.error('Redis error:', err));
            this.client.on('connect', () => console.log('Redis connected'));
            this.client.on('end', () => console.log('Redis disconnected'));

            await this.client.connect();
            return this.client;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.client = null;
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
    }

    async #ensureClient() {
        if (!this.client) {
            await this.connect();
        }
    }

    async set(key, value, ttl = null) {
        try {
            await this.#ensureClient();

            const fallbackTTL = parseInt(process.env.REDIS_EXPIRY_TIME, 10);
            const expiry = Number.isFinite(ttl) ? ttl :
                Number.isFinite(fallbackTTL) ? fallbackTTL : null;

            let result;
            if (expiry && expiry > 0) {
                result = await this.client.set(key, JSON.stringify(value), { EX: expiry });
            } else {
                result = await this.client.set(key, JSON.stringify(value));
            }

            console.log(`[RedisHelper] Set key ${key} with TTL ${expiry}`);
            return result;
        } catch (err) {
            console.error("Redis SET error:", err);
            throw err;
        }
    }

    async get(key) {
        try {
            await this.#ensureClient();
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting key:', error);
            throw error;
        }
    }

    async delete(key) {
        try {
            await this.#ensureClient();
            await this.client.del(key);
        } catch (error) {
            console.error('Error deleting key:', error);
            throw error;
        }
    }

    async exists(key) {
        try {
            await this.#ensureClient();
            return (await this.client.exists(key)) === 1;
        } catch (error) {
            console.error('Error checking existence:', error);
            throw error;
        }
    }

    async keys(pattern = '*') {
        try {
            await this.#ensureClient();
            return await this.client.keys(pattern);
        } catch (error) {
            console.error('Error retrieving keys:', error);
            throw error;
        }
    }

    async clear() {
        try {
            await this.#ensureClient();
            await this.client.flushDb();
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    }
}

module.exports = new RedisHelper();