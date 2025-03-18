const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const adminUsersFilePath = path.join(__dirname, "adminUsers.json");

const loadAdminUsers = () => {
    if (!fs.existsSync(adminUsersFilePath)) {
        fs.writeFileSync(adminUsersFilePath, "[]", "utf8");  // Opret tom JSON-fil
        return [];
    }

    const fileContent = fs.readFileSync(adminUsersFilePath, "utf8") || "[]"; // Håndter tom fil
    try {
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Fejl ved parsing af adminUsers.json:", error);
        return []; // Returnér tom liste ved fejl
    }
};

const saveAdminUsers = (users) => {
    fs.writeFileSync(adminUsersFilePath, JSON.stringify(users, null, 2), "utf8");
};

module.exports = { loadAdminUsers, saveAdminUsers };
