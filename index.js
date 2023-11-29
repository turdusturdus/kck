import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import catalogueController from './catalogueController.js';
import taggerController from './taggerController.js';

const app = express();

const port = 3000;

const originalsDir = 'storage/originals';
const thumbnailsDir = 'storage/thumbnails';
fs.mkdirSync(originalsDir, { recursive: true });
fs.mkdirSync(thumbnailsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, originalsDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(express.json());

app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(originalsDir, filename);
  const thumbnailPath = path.join(thumbnailsDir, `thumbnail-${filename}`);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error deleting the original file');
      }

      // Optionally delete the thumbnail
      if (fs.existsSync(thumbnailPath)) {
        fs.unlink(thumbnailPath, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error deleting the thumbnail file');
          }
        });
      }

      // Optionally update metadata file
      // ... [Your code to update/delete the metadata from metadata.json]

      res.send('File deleted successfully');
    });
  } else {
    res.status(404).send('File not found');
  }
});

app.post('/upload', upload.array('image', 10), async (req, res) => {
  try {
    let metadataArray = [];

    const metadataFilePath = path.join('storage', 'metadata.json');
    if (fs.existsSync(metadataFilePath)) {
      const existingMetadata = fs.readFileSync(metadataFilePath);
      metadataArray = JSON.parse(existingMetadata);
    }

    if (req.files) {
      await Promise.all(
        req.files.map(async (file) => {
          const thumbnailFilename = `thumbnail-${file.originalname}`;
          const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

          if (!fs.existsSync(thumbnailPath)) {
            await sharp(file.path)
              .resize({
                width: 200,
                height: 200,
                fit: sharp.fit.inside,
              })
              .toFile(thumbnailPath);

            const metadata = {
              originalName: file.originalname,
              path: file.path,
              thumbnailPath: thumbnailPath,
              uploadDate: new Date().toISOString(),
            };

            metadataArray.push(metadata);
          }
        })
      );

      fs.writeFileSync(
        metadataFilePath,
        JSON.stringify(metadataArray, null, 2)
      );
    }

    res.send(
      `${req.files.length} files uploaded and thumbnails created successfully.`
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing files');
  }
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(originalsDir, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.use('/catalogue', catalogueController);
app.use('/tagger', taggerController);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
