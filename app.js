const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const sharp = require('sharp'); 
const port = 3000;

const originalsDir = 'storage/originals';
const thumbnailsDir = 'storage/thumbnails';
fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(thumbnailsDir, { recursive: true });

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
    let metadataArray = []; // Initialize an array to collect metadata

    // Read existing metadata from the file if it exists
    const metadataFilePath = path.join('storage', 'metadata.json');
    if (fs.existsSync(metadataFilePath)) {
      const existingMetadata = fs.readFileSync(metadataFilePath);
      metadataArray = JSON.parse(existingMetadata);
    }

    if (req.files) {
      await Promise.all(req.files.map(async file => {
        const thumbnailFilename = `thumbnail-${file.originalname}`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

        // Check if thumbnail already exists
        if (!fs.existsSync(thumbnailPath)) {
          await sharp(file.path)
            .resize({
              width: 200,
              height: 200,
              fit: sharp.fit.inside
            })
            .toFile(thumbnailPath);
          
          const metadata = {
            originalName: file.originalname,
            path: file.path,
            thumbnailPath: thumbnailPath,
            uploadDate: new Date().toISOString()
          };

          metadataArray.push(metadata); // Add the new metadata to the array
        }
      }));

      // Write the updated array of metadata to the JSON file
      fs.writeFileSync(
        metadataFilePath,
        JSON.stringify(metadataArray, null, 2)
      );
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

  if (fs.existsSync(filePath)) {
    res.download(filePath); // Set the Content-Disposition header to attachment to prompt download
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
