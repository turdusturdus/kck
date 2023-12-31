import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const cataloguesFilePath = path.join('storage', 'catalogues.json');
const metadataFilePath = path.join('storage', 'metadata.json');
const logFilePath = 'storage/tags.log';

const readMetadata = () => {
  if (fs.existsSync(metadataFilePath)) {
    return JSON.parse(fs.readFileSync(metadataFilePath));
  }
  return [];
};

const saveMetadata = (metadata) => {
  fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
};

router.post('/tags/tag-images', (req, res) => {
  const { catalogueName } = req.query;
  const catalogues = JSON.parse(fs.readFileSync(cataloguesFilePath));
  const metadata = readMetadata();

  function addTagToImageMetadata(imageMetadata) {
    const startTime = Date.now();
    const randomTag = Math.random() < 0.5 ? 'banana' : 'apple';
    if (!Array.isArray(imageMetadata.tags)) {
      imageMetadata.tags = [];
    }
    if (!imageMetadata.tags.includes(randomTag)) {
      imageMetadata.tags.push(randomTag);
    }
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    const logEntry = `Tagged ${imageMetadata.originalName} with '${randomTag}' in ${processingTime}ms\n`;
    fs.appendFileSync(logFilePath, logEntry);
  }

  if (catalogueName) {
    if (!catalogues[catalogueName]) {
      return res.status(404).send('Catalogue not found');
    }

    catalogues[catalogueName].images.forEach((imageName) => {
      const imageMetadata = metadata.find(
        (meta) => meta.originalName === imageName
      );
      if (imageMetadata) {
        addTagToImageMetadata(imageMetadata);
      }
    });
  } else {
    metadata.forEach(addTagToImageMetadata);
  }

  saveMetadata(metadata);
  res.send(
    catalogueName
      ? `Images in catalogue '${catalogueName}' tagged successfully.`
      : 'All images tagged successfully.'
  );
});

router.get('/tags/statistics', (req, res) => {
  const metadata = readMetadata();
  const tagStatistics = {};

  metadata.forEach((image) => {
    if (Array.isArray(image.tags)) {
      image.tags.forEach((tag) => {
        if (tagStatistics[tag]) {
          tagStatistics[tag] += 1;
        } else {
          tagStatistics[tag] = 1;
        }
      });
    }
  });

  res.send(tagStatistics);
});

router.get('/tags/logs', (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading log file');
    }
    res.type('text/plain').send(data);
  });
});

export default router;
