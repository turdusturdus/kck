const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Ensure directories exist
const originalsDir = 'storage/originals';
const thumbnailsDir = 'storage/thumbnails';
fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(thumbnailsDir, { recursive: true });

// Configure storage for original images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, originalsDir);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

// Initialize Multer
const upload = multer({ storage: storage });

// Define a route for file upload
app.post('/upload', upload.array('image', 10), async (req, res) => {
  try {
    if (req.files) {
      await Promise.all(req.files.map(async file => {
        // ... [your existing thumbnail creation code]

        // Create metadata
        const metadata = {
          originalName: file.originalname,
          path: file.path,
          thumbnailPath: path.join(thumbnailsDir, file.originalname),
          uploadDate: new Date().toISOString()
          // Add more metadata as needed
        };

        // Save metadata to a JSON file
        fs.writeFileSync(
          path.join(originalsDir, file.originalname + '.json'),
          JSON.stringify(metadata, null, 2)
        );
      }));
    }

    res.send(`${req.files.length} files uploaded and thumbnails created successfully.`);
  } catch(err) {
    console.error(err);
    res.status(500).send('Error processing files');
  }
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(originalsDir, filename);

  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.download(filePath); // Set the Content-Disposition header to attachment to prompt download
  } else {
    res.status(404).send('File not found');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
