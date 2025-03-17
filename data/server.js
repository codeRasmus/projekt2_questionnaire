const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const crypto = require("crypto");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  console.log("We are running");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/submitUser", (req, res) => {
  console.log("Modtaget POST-request fra klienten:");
  console.log(req.body); // Debugging

  if (
    !req.body.alder ||
    !req.body.køn ||
    !req.body.uddannelse ||
    !req.body.beskæftigelse ||
    !req.body.runNr
  ) {
    return res.status(400).json({ error: "Manglende data i request body" });
  }

  const userData = {
    demografi: {
      alder: req.body.alder,
      køn: req.body.køn,
      uddannelse: req.body.uddannelse,
      beskæftigelse: req.body.beskæftigelse,
      runNr: req.body.runNr,
    },
  };

  const userId = Date.now();
  const jsonFilePath = path.join(__dirname, "users", `${userId}.json`);

  fs.mkdir(path.join(__dirname, "users"), { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating users directory:", err);
      return res.status(500).send("Error creating user directory.");
    }

    fs.writeFile(jsonFilePath, JSON.stringify(userData, null, 2), (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return res.status(500).json({ error: "Error saving user data." });
      }
      console.log("User data saved successfully to:", jsonFilePath);

      // // ✅ Send JSON response i stedet for HTML
      // res.json({ message: "User data saved!", redirect: "/page1.html" });
    });
  });
  res.redirect("/page1.html");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
