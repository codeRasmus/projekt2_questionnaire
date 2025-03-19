const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware til at autentificere JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"]; // Hent Authorization-header

    console.log("Modtaget token i request:", authHeader); // Log modtaget token

    // Hvis der ikke er noget token, afvis adgang
    if (!authHeader) {
        console.log("❌ Ingen token modtaget");
        return res.status(403).json({ error: "Adgang nægtet: Ingen token angivet" });
    }
    // Sikre, at token har korrekt format ("Bearer <token>")
    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        console.log("❌ Forkert token-format:", authHeader);
        return res.status(403).json({ error: "Ugyldigt token-format" });
    }
    // Fjern "Bearer " fra token
    const tokenValue = tokenParts[1];
    console.log("Renset token:", tokenValue);
   
    jwt.verify(tokenValue, SECRET_KEY, (err, user) => {
        if (err) {
            console.log("❌ Token validering fejlede:", err.message);
            return res.status(403).json({ error: "Ugyldigt eller udløbet token" });
        } 
        console.log("✅ Token godkendt:", user);
        req.user = user; // Sæt brugerdata på request-objektet
        next();
    });
}

module.exports = { authenticateToken };
