const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware til at autentificere JWT
function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.sendStatus(403); // Hvis der ikke er noget token, afvis adgang

    jwt.verify(token.split(" ")[1], SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Hvis tokenet er ugyldigt, afvis adgang
        req.user = user; // Sæt brugerdata på req objektet
        next();
    });
}

module.exports = { authenticateToken };
