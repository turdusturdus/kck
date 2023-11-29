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

  if (catalogueName) {
    // If a catalogue is specified
    if (!catalogues[catalogueName]) {
      return res.status(404).send('Catalogue not found');
    }

    catalogues[catalogueName].images.forEach((imageName) => {
      const imageMetadata = metadata.find(
        (meta) => meta.originalName === imageName
      );
      if (imageMetadata) {
        const randomTag = Math.random() < 0.5 ? 'banana' : 'apple';
        imageMetadata.tag = randomTag;
      }
    });
  } else {
    // If no catalogue is specified, tag all images
    metadata.forEach((imageMetadata) => {
      const randomTag = Math.random() < 0.5 ? 'banana' : 'apple';
      imageMetadata.tag = randomTag;
    });
  }

  saveMetadata(metadata);
  res.send(
    catalogueName
      ? `Images in catalogue '${catalogueName}' tagged successfully.`
      : 'All images tagged successfully.'
  );
});

export default router;
