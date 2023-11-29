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

router.post('/catalogue/:name/remove-image', (req, res) => {
  const { name } = req.params;
  const { imageName } = req.body;

  const catalogues = readCatalogues();

  if (!catalogues[name]) {
    return res.status(404).send('Catalogue not found');
  }

  const index = catalogues[name].images.indexOf(imageName);
  if (index === -1) {
    return res.status(400).send('Image not found in catalogue');
  }

  catalogues[name].images.splice(index, 1);
  saveCatalogues(catalogues);

  res.send(`Image '${imageName}' removed from catalogue '${name}'.`);
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
