const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const archiver = require("archiver");
const xml2js = require("xml2js");
const { authenticateToken } = require("./authMiddleware");
const { loadAdminUsers } = require("./userModel");

require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

const router = express.Router();
const adminUsersFilePath = path.join(__dirname, "adminUsers.json");


// Admin login
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(adminUsersFilePath, 'utf8'));
    const user = users.find((u) => u.username === username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: "Forkert brugernavn eller adgangskode" });
    }

    // Generer JWT-token
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// Path til besvarelserne
const responsesDir = path.join(__dirname, "../users");

// Route til at hente en liste over JSON-besvarelser
router.get("/responses", authenticateToken, (req, res) => {
    const responsesDir = path.join(__dirname, "../users");

    fs.readdir(responsesDir, (err, files) => {
        if (err) return res.status(500).json({ message: "Fejl ved hentning af besvarelser" });
        res.json({ responses: files });
    });
});

// Route til at downloade besvarelserne som en ZIP-fil
router.get("/download-responses", authenticateToken, (req, res) => {
        // Log brugerens information (hvis autentifikationen er vellykket)
        console.log("Token valideret for bruger:", req.user); 
    const zipFilePath = path.join(__dirname, "../responses.zip");

    const output = fs.createWriteStream(zipFilePath);
    // const archive = require("archiver")("zip");
    const archive = archiver("zip", {
        zlib: { level: 9 }, // Komprimeringsniveau
    });

    output.on("close", () => {
        res.download(zipFilePath, 'responses.zip', (err) => {
            if (err) {
                return res.status(500).json({ message: "Fejl ved download af ZIP" });
            }
            // Ryd op ved at slette zip-filen efter download
            fs.unlink(zipFilePath, (err) => {
                if (err) console.error('Fejl ved sletning af zip-fil:', err);
            });
        });
    });

    archive.on("error", (err) => res.status(500).json({ message: "Fejl ved ZIP-oprettelse" }));

    archive.pipe(output);
    
    fs.readdir(responsesDir, (err, files) => {
        if (err) return res.status(500).json({ message: "Fejl ved ZIP-oprettelse" });

        files.forEach(file => {
            if (file.endsWith(".json")) { // Sørg for kun at tilføje JSON-filer
                archive.file(path.join(responsesDir, file), { name: file });
            }
        });

        archive.finalize();
    });
});

router.get("/responses", authenticateToken, (req, res) => {
});

module.exports = router;
