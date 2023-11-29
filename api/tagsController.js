import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const cataloguesFilePath = path.join('storage', 'catalogues.json');
const metadataFilePath = path.join('storage', 'metadata.json');

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
    const randomTag = Math.random() < 0.5 ? 'banana' : 'apple';
    if (!Array.isArray(imageMetadata.tags)) {
      imageMetadata.tags = [];
    }
    if (!imageMetadata.tags.includes(randomTag)) {
      imageMetadata.tags.push(randomTag);
    }
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

export default router;
