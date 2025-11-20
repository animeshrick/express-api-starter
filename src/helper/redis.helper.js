const redis = require('redis');
require('dotenv').config();

/**
 * RedisHelper class provides a wrapper around the Redis client with utility methods
 * for common Redis operations including basic key-value operations and list operations.
 */
class RedisHelper {
    /**
     * Initializes a new instance of RedisHelper.
     * Sets the Redis client to null initially; connection will be established when needed.
     */
    constructor() {
        this.client = null;
    }

    /**
     * Establishes a connection to the Redis server.
     * Uses environment variables REDIS_HOST and REDIS_PORT to form the connection URL.
     * Implements automatic reconnection strategy with exponential backoff (max 2000ms).
     * Sets up event listeners for error, connect, and disconnect events.
     * 
     * @returns {Promise<RedisClient>} The connected Redis client instance
     * @throws {Error} If connection to Redis fails
     */
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

    /**
     * Gracefully disconnects from the Redis server.
     * Sends QUIT command to Redis and sets the client to null.
     * Safe to call even if not currently connected.
     * 
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
    }

    /**
     * Private method that ensures a Redis client connection is established.
     * If no client exists, it will automatically call connect().
     * Used internally by all Redis operation methods.
     * 
     * @private
     * @returns {Promise<void>}
     */
    async #ensureClient() {
        if (!this.client) {
            await this.connect();
        }
    }

    /**
     * Sets a key-value pair in Redis with optional expiration time (TTL).
     * Automatically serializes the value to JSON before storing.
     * If TTL is not provided, falls back to REDIS_EXPIRY_TIME environment variable.
     * If neither TTL nor env variable is set, key persists indefinitely.
     * 
     * @param {string} key - The Redis key to set
     * @param {*} value - The value to store (will be JSON stringified)
     * @param {number|null} [ttl=null] - Time-to-live in seconds. If null, uses env variable or no expiry
     * @returns {Promise<string>} Redis SET command result (typically "OK")
     * @throws {Error} If the SET operation fails
     */
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

    /**
     * Retrieves a value from Redis by key.
     * Automatically parses the stored JSON string back to its original format.
     * 
     * @param {string} key - The Redis key to retrieve
     * @returns {Promise<*|null>} The parsed value if key exists, null if key doesn't exist
     * @throws {Error} If the GET operation or JSON parsing fails
     */
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

    /**
     * Deletes a key from Redis.
     * Safe to call even if the key doesn't exist.
     * 
     * @param {string} key - The Redis key to delete
     * @returns {Promise<void>}
     * @throws {Error} If the DEL operation fails
     */
    async delete(key) {
        try {
            await this.#ensureClient();
            await this.client.del(key);
        } catch (error) {
            console.error('Error deleting key:', error);
            throw error;
        }
    }

    /**
     * Checks if a key exists in Redis.
     * 
     * @param {string} key - The Redis key to check
     * @returns {Promise<boolean>} True if the key exists, false otherwise
     * @throws {Error} If the EXISTS operation fails
     */
    async exists(key) {
        try {
            await this.#ensureClient();
            return (await this.client.exists(key)) === 1;
        } catch (error) {
            console.error('Error checking existence:', error);
            throw error;
        }
    }

    /**
     * Retrieves all keys matching the specified pattern.
     * Uses glob-style patterns (e.g., 'user:*', 'session:?123', 'temp[abc]').
     * WARNING: This command can be expensive on large databases. Use SCAN in production.
     * 
     * @param {string} [pattern='*'] - Glob-style pattern to match keys. Default is '*' (all keys)
     * @returns {Promise<string[]>} Array of matching key names
     * @throws {Error} If the KEYS operation fails
     */
    async keys(pattern = '*') {
        try {
            await this.#ensureClient();
            return await this.client.keys(pattern);
        } catch (error) {
            console.error('Error retrieving keys:', error);
            throw error;
        }
    }

    /**
     * Clears all keys from the current Redis database.
     * Uses FLUSHDB command which removes all keys from the currently selected database.
     * WARNING: This operation is irreversible and will delete all data in the current DB.
     * 
     * @returns {Promise<void>}
     * @throws {Error} If the FLUSHDB operation fails
     */
    async clear() {
        try {
            await this.#ensureClient();
            await this.client.flushDb();
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    }

    /**
     * Returns a range of elements from a Redis list.
     * Indices are zero-based. Negative indices count from the end (-1 is last element).
     * Both start and stop are inclusive.
     * 
     * @param {string} key - The Redis list key
     * @param {number} start - Starting index (0-based, can be negative)
     * @param {number} stop - Ending index (inclusive, can be negative, -1 for last element)
     * @returns {Promise<string[]>} Array of list elements in the specified range
     * @throws {Error} If the LRANGE operation fails
     * @example
     * // Get first 10 elements
     * await lRange('mylist', 0, 9);
     * // Get all elements
     * await lRange('mylist', 0, -1);
     */
    async lRange(key, start, stop) {
        try {
            await this.#ensureClient();
            return await this.client.lRange(key, start, stop);
        } catch (error) {
            console.error('Error lRange cache:', error);
            throw error;
        }
    }

    /**
     * Removes elements from a Redis list that match the specified value.
     * The count parameter determines how many matches to remove and direction:
     * - count > 0: Remove elements from head to tail (left to right)
     * - count < 0: Remove elements from tail to head (right to left)
     * - count = 0: Remove all matching elements
     * 
     * @param {string} key - The Redis list key
     * @param {number} count - Number and direction of elements to remove
     * @param {string} value - The value to match and remove from the list
     * @returns {Promise<number>} Number of elements removed
     * @throws {Error} If the LREM operation fails
     */
    async lRem(key, count, value) {
        try {
            await this.#ensureClient();
            return await this.client.lRem(key, count, value);
        } catch (error) {
            console.error('Error lRem cache:', error);
            throw error;
        }
    }

    /**
     * Prepends one or more values to the head (left) of a Redis list.
     * Creates the list if it doesn't exist.
     * If you need to append to the tail, use rPush instead (not currently implemented).
     * 
     * @param {string} key - The Redis list key
     * @param {string|string[]} value - Value(s) to prepend to the list
     * @returns {Promise<number>} The length of the list after the push operation
     * @throws {Error} If the LPUSH operation fails
     */
    async lPush(key, value) {
        try {
            await this.#ensureClient();
            return await this.client.lPush(key, value);
        } catch (error) {
            console.error('Error lPush cache:', error);
            throw error;
        }
    }

    /**
     * Trims a Redis list to the specified range.
     * Removes all elements outside the specified range [start, stop].
     * Both indices are inclusive and can be negative (-1 is last element).
     * Useful for maintaining a fixed-size list (e.g., keeping only latest 100 items).
     * 
     * @param {string} key - The Redis list key
     * @param {number} start - Starting index of the range to keep (0-based, can be negative)
     * @param {number} stop - Ending index of the range to keep (inclusive, can be negative)
     * @returns {Promise<string>} "OK" on success
     * @throws {Error} If the LTRIM operation fails
     * @example
     * // Keep only the first 100 elements
     * await lTrim('mylist', 0, 99);
     */
    async lTrim(key, start, stop) {
        try {
            await this.#ensureClient();
            return await this.client.lTrim(key, start, stop);
        } catch (error) {
            console.error('Error lTrim cache:', error);
            throw error;
        }
    }   
}

module.exports = new RedisHelper();