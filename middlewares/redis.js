const redis = require('redis');
const jwt = require('jsonwebtoken');

// Create Redis client and handle errors
const client = redis.createClient();

client.on('error', (err) => {
    console.error('Redis error:', err);
});

client.on('connect', () => {
    console.log('Connected to Redis');
});

exports.logout = (token) => {
    return new Promise((resolve, reject) => {
        if (token) {
            // Verify the token
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    return reject({ status: 403, message: 'Token is invalid' });
                }

                const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);

                // Store the token in Redis with an expiration equal to the remaining life of the token
                client.set(token, 'blacklisted', 'EX', remainingTime, (err, reply) => {
                    if (err) {
                        console.error('Error storing token in Redis:', err);
                        return reject({ status: 500, message: 'Failed to log out' });
                    }

                    resolve({ status: 200, message: 'Successfully logged out' });
                });
            });
        } else {
            reject({ status: 400, message: 'No token provided' });
        }
    });
};

// Ensure client stays open and is closed only when the server shuts down
process.on('SIGINT', () => {
    client.quit();
    console.log('Redis client closed');
    process.exit(0);
});
