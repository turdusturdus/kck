import axios from 'axios';
import FormData from 'form-data';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { mainMenu } from './index.js';

async function showMetadata(selectedMetadata) {
  console.log('Metadata for the selected image:');
  const { tags, ...restOfMetadata } = selectedMetadata;
  console.table(restOfMetadata);
  console.table({ tags });

  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...',
    },
  ]);
}

async function allImages() {
  try {
    console.clear();
    const response = await axios.get('http://localhost:3000/image');
    const allMetadata = response.data;

    const imageChoices = ['Back to Menu'].concat(
      allMetadata.map((meta) => meta.originalName)
    );

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedImage',
        message:
          'Select an image to view its metadata, or choose "Back to Menu" to return:',
        choices: imageChoices,
      },
    ]);

    if (answer.selectedImage === 'Back to Menu') {
      return;
    }

    const selectedMetadata = allMetadata.find(
      (meta) => meta.originalName === answer.selectedImage
    );

    if (!selectedMetadata) {
      console.log('No metadata found for the selected image.');
      return;
    }

    console.clear();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Choose an action:',
        choices: [
          'Rename',
          'Show Metadata',
          'Delete',
          'Back to Image Selection',
        ],
      },
    ]);

    console.clear();

    switch (action) {
      case 'Rename':
        // Implement rename logic
        break;
      case 'Show Metadata':
        await showMetadata(selectedMetadata);
        break;
      case 'Delete':
        // Implement delete logic
        break;
      case 'Back to Image Selection':
        await allImages();
        break;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function uploadImage() {
  try {
    const homeDirectory = os.homedir();

    const answers = await inquirer.prompt([
      {
        type: 'file-tree-selection',
        name: 'filePaths',
        message:
          'Select .png or .jpg files to upload (use space to select, enter to submit):',
        multiple: true,
        root: homeDirectory,
        onlyShowValid: true,
        validate: (input) => {
          const fileStat = fs.statSync(input);
          const name = input.split(path.sep).pop();
          const extension = name.split('.').pop().toLowerCase();

          return (
            name[0] !== '.' &&
            (fileStat.isDirectory() ||
              extension === 'jpg' ||
              extension === 'jpeg' ||
              extension === 'png')
          );
        },
      },
    ]);

    const selectedFiles = answers.filePaths.filter((filePath) => {
      const fileStat = fs.statSync(filePath);
      return fileStat.isFile();
    });

    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append(
          'image',
          fs.createReadStream(file),
          path.basename(file)
        );
      });

      const response = await axios.post(
        'http://localhost:3000/upload',
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      console.log('Upload successful');
    } else {
      console.log('No files selected for upload.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

export async function imagesMenu() {
  try {
    console.clear();
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'imageChoice',
        message: 'Images Menu',
        choices: ['All Images', 'Upload', 'Back to Main Menu'],
      },
    ]);

    switch (answers.imageChoice) {
      case 'All Images':
        await allImages();
        break;
      case 'Upload':
        await uploadImage();
        break;
      case 'Back to Main Menu':
        mainMenu();
        return;
      default:
        console.log('Invalid choice');
    }
    await imagesMenu();
  } catch (error) {
    console.error('Error:', error);
  }
}
