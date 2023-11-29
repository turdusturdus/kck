import axios from 'axios';
import FormData from 'form-data';
import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-tree-selection-prompt';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { mainMenu } from './index.js';

async function allImages() {
  try {
    const response = await axios.get('http://localhost:3000/image');
    const allMetadata = response.data;

    const imageChoices = allMetadata.map((meta) => meta.originalName);
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedImage',
        message: 'Select an image to view its metadata:',
        choices: imageChoices,
      },
    ]);

    const selectedMetadata = allMetadata.find(
      (meta) => meta.originalName === answer.selectedImage
    );

    if (selectedMetadata) {
      console.log('Metadata for the selected image:', selectedMetadata);
    } else {
      console.log('No metadata found for the selected image.');
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

      console.log('Upload successful:', response.data);
    } else {
      console.log('No files selected for upload.');
    }

    console.log(`Files selected for upload: ${selectedFiles.join(', ')}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

export async function imagesMenu() {
  try {
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