const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1]; // Corrected split method

        if (!token) {
            return res.sendStatus(401); // Ensure to return the response
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Ensure to return the response
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};
