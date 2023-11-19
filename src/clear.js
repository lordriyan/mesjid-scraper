const fs = require("fs");
const path = require("path");

// Clear the console
console.clear();

// Directory
const dirs = ["./data/collection/", "./data/spreadsheet/"];

// For every directory
dirs.forEach((element) => {
  // Read all file inside directory
  fs.readdir(element, (err, files) => {
    // Throw error if occur
    if (err) throw err;
    // Remove all file
    for (const file of files) {
      // Delete file
      fs.unlink(path.join(element, file), (err) => {
        // Throw error if occur
        if (err) throw err;
      });
    }
  });
});

// Message the console
console.log(`All data has cleared!`);
