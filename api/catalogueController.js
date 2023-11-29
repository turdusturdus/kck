import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const originalsDir = 'storage/originals';
const cataloguesFilePath = path.join('storage', 'catalogues.json');

const readCatalogues = () => {
  if (fs.existsSync(cataloguesFilePath)) {
    return JSON.parse(fs.readFileSync(cataloguesFilePath));
  }
  return {};
};

const saveCatalogues = (catalogues) => {
  fs.writeFileSync(cataloguesFilePath, JSON.stringify(catalogues, null, 2));
};

router.post('/catalogue', (req, res) => {
  const { name, images } = req.body;

  if (!name) {
    return res.status(400).send('Catalogue name is required');
  }

  const catalogues = readCatalogues();

  if (catalogues[name]) {
    return res.status(400).send('Catalogue already exists');
  }

  let existingImages = [];
  if (Array.isArray(images)) {
    existingImages = images.filter((image) =>
      fs.existsSync(path.join(originalsDir, image))
    );
  }

  catalogues[name] = {
    creationDate: new Date().toISOString(),
    images: existingImages,
  };

  saveCatalogues(catalogues);

  res.send(`Catalogue '${name}' created successfully.`);
});

router.get('/catalogue/:catalogueName', (req, res) => {
  try {
    const { catalogueName } = req.params;
    const catalogues = readCatalogues();

    if (catalogues.hasOwnProperty(catalogueName)) {
      res.json(catalogues[catalogueName]);
    } else {
      res.status(404).send('Catalogue not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/catalogue', (req, res) => {
  try {
    const catalogues = readCatalogues();
    res.json(catalogues);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/catalogue/:name/add-image', (req, res) => {
  const { name } = req.params;
  let { imageName } = req.body;

  const catalogues = readCatalogues();

  if (!catalogues[name]) {
    return res.status(404).send('Catalogue not found');
  }

  if (!Array.isArray(imageName)) {
    imageName = [imageName];
  }

  imageName = imageName.filter((img) => !catalogues[name].images.includes(img));

  catalogues[name].images.push(...imageName);
  saveCatalogues(catalogues);

  res.send(`Images added to catalogue '${name}'.`);
});

router.post('/catalogue/:name/add-images', (req, res) => {
  const { name } = req.params;
  let { imageNames } = req.body; // Expecting an array of image names

  const catalogues = readCatalogues();

  if (!catalogues[name]) {
    return res.status(404).send('Catalogue not found');
  }

  // Ensure imageNames is an array, even if a single name is provided
  if (!Array.isArray(imageNames)) {
    imageNames = [imageNames];
  }

  // Filter out images that are already in the catalogue
  const newImages = imageNames.filter(
    (img) => !catalogues[name].images.includes(img)
  );

  // Add new images to the catalogue
  catalogues[name].images.push(...newImages);
  saveCatalogues(catalogues);

  res.send(`Images added to catalogue '${name}': ${newImages.join(', ')}`);
});

router.post('/catalogue/:name/remove-image', (req, res) => {
  const { name } = req.params;
  let { imageName } = req.body;

  const catalogues = readCatalogues();

  if (!catalogues[name]) {
    return res.status(404).send('Catalogue not found');
  }

  // Ensure imageName is an array
  if (!Array.isArray(imageName)) {
    imageName = [imageName];
  }

  let imagesNotFound = [];
  imageName.forEach((img) => {
    const index = catalogues[name].images.indexOf(img);
    if (index !== -1) {
      catalogues[name].images.splice(index, 1);
    } else {
      imagesNotFound.push(img);
    }
  });

  saveCatalogues(catalogues);

  if (imagesNotFound.length > 0) {
    res
      .status(400)
      .send(`Some images not found in catalogue: ${imagesNotFound.join(', ')}`);
  } else {
    res.send(
      `Images removed from catalogue '${name}': ${imageName.join(', ')}`
    );
  }
});

router.delete('/catalogue/:name', (req, res) => {
  const { name } = req.params;

  const catalogues = readCatalogues();

  if (!catalogues[name]) {
    return res.status(404).send('Catalogue not found');
  }

  // Delete the catalogue
  delete catalogues[name];
  saveCatalogues(catalogues);

  res.send(`Catalogue '${name}' removed successfully.`);
});

router.put('/catalogue/:name/rename', (req, res) => {
  const { name } = req.params;
  const { newName } = req.body;

  if (!newName) {
    return res.status(400).send('New catalogue name is required');
  }

  const catalogues = readCatalogues();

  if (!catalogues[name]) {
    return res.status(404).send('Catalogue not found');
  }

  if (catalogues[newName]) {
    return res.status(400).send('Catalogue with the new name already exists');
  }

  // Rename the catalogue
  catalogues[newName] = { ...catalogues[name] };
  delete catalogues[name];
  saveCatalogues(catalogues);

  res.send(`Catalogue '${name}' renamed to '${newName}' successfully.`);
});

export default router;
