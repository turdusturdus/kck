import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import catalogueController from './catalogueController.js';
import tagsController from './tagsController.js';
import morgan from 'morgan';

const app = express();

const port = 3000;

const originalsDir = 'storage/originals';
const thumbnailsDir = 'storage/thumbnails';
const metadataFilePath = 'storage/metadata.json';
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
app.use(morgan('common'));

app.delete('/image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(originalsDir, filename);
  const thumbnailPath = path.join(thumbnailsDir, `thumbnail-${filename}`);
  const metadataFilePath = path.join('storage', 'metadata.json');

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error deleting the original file');
      }

      if (fs.existsSync(thumbnailPath)) {
        fs.unlink(thumbnailPath, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error deleting the thumbnail file');
          }
        });
      }

      if (fs.existsSync(metadataFilePath)) {
        const metadataArray = JSON.parse(fs.readFileSync(metadataFilePath));
        const updatedMetadata = metadataArray.filter(
          (meta) => meta.originalName !== filename
        );
        fs.writeFileSync(
          metadataFilePath,
          JSON.stringify(updatedMetadata, null, 2)
        );
      }

      res.send('File deleted successfully');
    });
  } else {
    res.status(404).send('File not found');
  }
});

app.post('/image', upload.array('image', 10), async (req, res) => {
  console.log(req.files.length);
  try {
    let metadataArray = [];

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

app.post('/image/rename', async (req, res) => {
  const { originalName, newName } = req.body;
  const originalFilePath = path.join(originalsDir, originalName);
  const newFilePath = path.join(originalsDir, newName);
  const originalThumbnailPath = path.join(
    thumbnailsDir,
    `thumbnail-${originalName}`
  );
  const newThumbnailPath = path.join(thumbnailsDir, `thumbnail-${newName}`);

  try {
    if (fs.existsSync(originalFilePath)) {
      fs.renameSync(originalFilePath, newFilePath);
      if (fs.existsSync(originalThumbnailPath)) {
        fs.renameSync(originalThumbnailPath, newThumbnailPath);
      }

      if (fs.existsSync(metadataFilePath)) {
        const metadataArray = JSON.parse(fs.readFileSync(metadataFilePath));
        const metadataIndex = metadataArray.findIndex(
          (meta) => meta.originalName === originalName
        );

        if (metadataIndex !== -1) {
          metadataArray[metadataIndex].originalName = newName;
          metadataArray[metadataIndex].path = newFilePath;
          metadataArray[metadataIndex].thumbnailPath = newThumbnailPath;
          fs.writeFileSync(
            metadataFilePath,
            JSON.stringify(metadataArray, null, 2)
          );
        }
      }

      res.send('Image renamed successfully');
    } else {
      res.status(404).send('Original file not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error renaming file');
  }
});

app.get('/image', (req, res) => {
  const metadataFilePath = path.join('storage', 'metadata.json');

  if (fs.existsSync(metadataFilePath)) {
    fs.readFile(metadataFilePath, (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error reading metadata file');
        return;
      }

      try {
        const metadata = JSON.parse(data);
        res.json(metadata);
      } catch (parseErr) {
        console.error(parseErr);
        res.status(500).send('Error parsing metadata file');
      }
    });
  } else {
    res.status(404).send('Metadata file not found');
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
app.use('/', tagsController);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
