import axios from 'axios';
import FormData from 'form-data';
import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-tree-selection-prompt';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { mainMenu } from './index.js';

async function addImages(catalogueName) {
  try {
    // Fetch all images
    const allImagesResponse = await axios.get('http://localhost:3000/image');
    const allImages = allImagesResponse.data.map((image) => image.originalName);

    // Fetch current catalogue
    const catalogueResponse = await axios.get(
      `http://localhost:3000/catalogue/${catalogueName}`
    );
    const catalogueImages = catalogueResponse.data.images;

    // Filter out images already in the catalogue
    const availableImages = allImages.filter(
      (image) => !catalogueImages.includes(image)
    );

    if (availableImages.length === 0) {
      console.log('No new images available to add.');
      return;
    }

    const { selectedImages } = await inquirer.prompt([
      {
        type: 'search-checkbox',
        message: 'Select images to add to the catalogue:',
        name: 'selectedImages',
        choices: availableImages,
      },
    ]);

    if (selectedImages.length > 0) {
      // Send selected images to the server to add them to the catalogue
      const response = await axios.post(
        `http://localhost:3000/catalogue/${encodeURIComponent(
          catalogueName
        )}/add-images`,
        { imageNames: selectedImages }
      );
      console.log(response.data);
    } else {
      console.log('No images selected.');
    }
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

async function renameCatalogue(oldCatalogueName) {
  try {
    const { newCatalogueName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newCatalogueName',
        message: 'Enter the new name for the catalogue:',
        validate: (input) => input.trim() !== '' && input !== oldCatalogueName,
      },
    ]);

    const response = await axios.put(
      `http://localhost:3000/catalogue/${encodeURIComponent(
        oldCatalogueName
      )}/rename`,
      {
        newName: newCatalogueName,
      }
    );

    console.log(response.data);
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

async function deleteCatalogue(catalogueName) {
  try {
    const response = await axios.delete(
      `http://localhost:3000/catalogue/${encodeURIComponent(catalogueName)}`
    );
    console.log(response.data);
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

async function exploreCatalogues() {
  try {
    console.clear();
    const response = await axios.get('http://localhost:3000/catalogue');
    const catalogues = response.data;

    if (Object.keys(catalogues).length === 0) {
      console.log('No catalogues available.');
      return;
    }

    const catalogueChoices = ['Back to Catalogues Menu'].concat(
      Object.keys(catalogues)
    );
    const { selectedCatalogue } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCatalogue',
        message: 'Select a catalogue to explore:',
        choices: catalogueChoices,
      },
    ]);

    if (selectedCatalogue === 'Back to Catalogues Menu') {
      return;
    }

    const actionChoices = [
      'Rename Catalogue',
      'Delete Catalogue',
      'View Details',
      'Add Images',
      'Back to Catalogues Menu',
    ];
    console.clear();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Choose an action:',
        choices: actionChoices,
      },
    ]);

    console.clear();

    switch (action) {
      case 'Rename Catalogue':
        await renameCatalogue(selectedCatalogue);
        break;
      case 'Delete Catalogue':
        await deleteCatalogue(selectedCatalogue);
        break;
      case 'View Details':
        const catalogueDetails = catalogues[selectedCatalogue];
        console.log(`Details of '${selectedCatalogue}' catalogue:`);
        console.table(catalogueDetails.images); // Adjust this according to your data structure
        break;
      case 'Add Images':
        await addImages(selectedCatalogue);
        break;
      case 'Back to Catalogues Menu':
        return;
    }

    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...',
      },
    ]);
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

async function allCatalogues() {
  try {
    const response = await axios.get('http://localhost:3000/catalogue');

    const catalogues = response.data;
    if (Object.keys(catalogues).length === 0) {
      console.log('No catalogues available.');
    } else {
      console.log('Catalogues:');
      console.table(
        Object.keys(catalogues).map((key) => {
          const value = catalogues[key];
          return {
            catalogue: key,
            creationDate: value.creationDate,
            'images count': value.images.length,
          };
        })
      );
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: 'Press Enter to continue...',
        },
      ]);
    }
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

async function createCatalogue() {
  try {
    console.clear();
    const { catalogueName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'catalogueName',
        message: 'Enter a name for the new catalogue (submit empty to cancel):',
        validate: (input) => {
          return true; // You can add more validation if necessary
        },
      },
    ]);

    if (!catalogueName.trim()) {
      console.log('Catalogue creation cancelled.');
      return;
    }

    // Create the new catalogue
    const response = await axios.post('http://localhost:3000/catalogue', {
      name: catalogueName,
    });

    console.clear();
    console.log(response.data);

    // After creating the catalogue, allow adding images to it
    await addImages(catalogueName);
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

export async function cataloguesMenu() {
  try {
    console.clear();
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'catalogueChoice',
        message: 'Catalogues Menu',
        choices: [
          'All Catalogues',
          'Create Catalogue',
          'Explore Catalogues',
          'Back to Main Menu',
        ],
      },
    ]);

    switch (answers.catalogueChoice) {
      case 'All Catalogues':
        await allCatalogues();
        break;
      case 'Create Catalogue':
        await createCatalogue();
        break;
      case 'Explore Catalogues':
        await exploreCatalogues();
        break;
      case 'Back to Main Menu':
        mainMenu();
        return;
      default:
        console.log('Invalid choice');
    }
    await cataloguesMenu();
  } catch (error) {
    console.error('Error:', error);
  }
}
