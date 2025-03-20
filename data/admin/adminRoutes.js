const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const archiver = require("archiver");
const libxmljs = require("libxmljs");
const { authenticateToken } = require("./authMiddleware");

require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

const router = express.Router();
const adminUsersFilePath = path.join(__dirname, "adminUsers.json");
// Midlertidig lagring af uploadet xml fil
const upload = multer({ dest: "uploads/" });
const usersFolder = "./users";

// Admin login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const adminUsers = JSON.parse(fs.readFileSync(adminUsersFilePath, "utf8"));
  const user = adminUsers.find(user => user.username === username);

    if (!user) {
    return res
      .status(401)
      .json({ message: "Forkert brugernavn eller adgangskode" });
  }

    // Sammenlign adgangskoden med bcrypt
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ error: "Forkert brugernavn eller adgangskode" });
      }

  // Generer JWT-token
  const token = jwt.sign({ username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });
  res.json({ token });
});
});

// Path til besvarelserne
const responsesDir = path.join(__dirname, "../users");

// Route til at hente en liste over JSON-besvarelser
router.get("/responses", authenticateToken, (req, res) => {
  const responsesDir = path.join(__dirname, "../users");

  fs.readdir(responsesDir, (err, files) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Fejl ved hentning af besvarelser" });
    res.json({ responses: files });
  });
});

// Route til at downloade besvarelserne som en ZIP-fil
router.get("/download-responses", authenticateToken, (req, res) => {
  // Log brugerens information (hvis autentifikationen er vellykket)
  console.log("Token valideret for bruger:", req.user);
  const zipFilePath = path.join(__dirname, "../responses.zip");

  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Komprimeringsniveau
  });

  output.on("close", () => {
    res.download(zipFilePath, "responses.zip", (err) => {
      if (err) {
        return res.status(500).json({ message: "Fejl ved download af ZIP" });
      }
      // Ryd op ved at slette zip-filen efter download
      fs.unlink(zipFilePath, (err) => {
        if (err) console.error("Fejl ved sletning af zip-fil:", err);
      });
    });
  });

  archive.on("error", (err) =>
    res.status(500).json({ message: "Fejl ved ZIP-oprettelse" })
  );

  archive.pipe(output);

  fs.readdir(responsesDir, (err, files) => {
    if (err)
      return res.status(500).json({ message: "Fejl ved ZIP-oprettelse" });

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        // Sørg for kun at tilføje JSON-filer
        archive.file(path.join(responsesDir, file), { name: file });
      }
    });

    archive.finalize();
  });
});

router.get("/responses", authenticateToken, (req, res) => {});

// Route til upload af en ny .xml fil
router.post(
  "/upload-xml",
  authenticateToken,
  upload.single("xmlFile"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Ingen fil modtaget." });
    }

    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "../public/spørgeskema.xml");
    const xsdPath = path.join(__dirname, "../validation/schema.xsd");

    // Tjek om filen er en XML-fil
    if (path.extname(req.file.originalname).toLowerCase() !== ".xml") {
      fs.unlink(tempPath, () => {});
      return res.status(400).json({ error: "Kun XML-filer er tilladt." });
    }

    // Læs XML-indholdet
    fs.readFile(tempPath, "utf8", (err, xmlData) => {
      if (err) {
        fs.unlink(tempPath, () => {});
        return res
          .status(500)
          .json({ error: "Fejl ved læsning af XML-filen." });
      }

      try {
        // Parse XML
        const xmlDoc = libxmljs.parseXml(xmlData);

        // Læs XSD-skemaet
        fs.readFile(xsdPath, "utf8", (err, xsdData) => {
          if (err) {
            fs.unlink(tempPath, () => {});
            return res
              .status(500)
              .json({ error: "Fejl ved læsning af XSD-skemaet." });
          }

          // Parse XSD
          const xsdDoc = libxmljs.parseXml(xsdData);

          // Validér XML mod XSD
          if (!xmlDoc.validate(xsdDoc)) {
            fs.unlink(tempPath, () => {});
            return res.status(400).json({
              error: "XML er ikke valid i forhold til XSD.",
              details: xmlDoc.validationErrors,
            });
          }

          // Slet den gamle fil først, hvis den eksisterer
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
          }

          // Flyt den nye fil til public-mappen og omdøb
          fs.rename(tempPath, targetPath, (err) => {
            if (err) {
              return res.status(500).json({ error: "Fejl ved upload." });
            }
            res.status(200).json({ message: "Spørgeskemaet er opdateret!" });
          });
        });
      } catch (e) {
        fs.unlink(tempPath, () => {});
        return res.status(400).json({ error: "Ugyldig XML-fil: Syntaxfejl." });
      }
    });
  }
);

router.get("/getStatistics", async (req, res) => {
  try {
    // Læs alle filer i mappen 'usersFolder'
    console.log("Forsøger at læse filer fra mappen:", usersFolder);
    const files = await fs.promises.readdir(usersFolder);
    console.log("Filer i mappen:", files);

    // Filtrer kun de filer, der ender på '.json'
    const jsonFiles = files.filter((file) => file.endsWith(".json"));
    console.log("JSON filer fundet:", jsonFiles);

    const allData = [];

    // Læs hver JSON-fil og tilføj dens data til allData-arrayet
    for (const file of jsonFiles) {
      const filePath = path.join(usersFolder, file);
      console.log("Læser fil:", filePath);

      const fileData = await fs.promises.readFile(filePath, "utf-8");
      console.log(`Data fra fil ${file}:`, fileData);

      // Parse JSON-data og tilføj det til allData-arrayet
      allData.push(JSON.parse(fileData));
      console.log(`Data fra ${file} tilføjet.`);
    }

    // Returner alle data som JSON-svar
    console.log("Alle data indlæst:", allData);
    res.json(allData);
  } catch (err) {
    // Håndter fejl og log fejlbeskeden
    console.error("Fejl opstod under hentning af statistik:", err);
    res.status(500).json({ error: "Kunne ikke hente statistik" });
  }
});

module.exports = router;
