import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-tree-selection-prompt';
import path from 'path';
import fs from 'fs';
import os from 'os';
import chalk from 'chalk';
inquirer.registerPrompt('file-tree-selection', fileSelector);

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

    console.log(`Files selected for upload: ${selectedFiles.join(', ')}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function imagesMenu() {
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
        // Implement your logic for showing all images
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

async function cataloguesMenu() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'catalogueChoice',
        message: 'Catalogues Menu',
        choices: ['All Catalogues', 'Create Catalogue', 'Back to Main Menu'],
      },
    ]);

    switch (answers.catalogueChoice) {
      case 'All Catalogues':
        // Implement your logic for all catalogues
        break;
      case 'Create Catalogue':
        // Implement your logic for creating a catalogue
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

async function tagsMenu() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'tagChoice',
        message: 'Tags Menu',
        choices: [
          'Generate for All Images',
          'Generate Tags for Catalogue',
          'Statistics',
          'Logs',
          'Back to Main Menu',
        ],
      },
    ]);

    switch (answers.tagChoice) {
      case 'Generate for All Images':
        // Implement your logic for generating tags for all images
        break;
      case 'Generate Tags for Catalogue':
        // Implement your logic for generating tags for a catalogue
        break;
      case 'Statistics':
        // Implement your logic for statistics
        break;
      case 'Logs':
        // Implement your logic for logs
        break;
      case 'Back to Main Menu':
        mainMenu();
        return;
      default:
        console.log('Invalid choice');
    }
    await tagsMenu();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function mainMenu() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'menuChoice',
        message: 'Main Menu',
        choices: ['Images', 'Catalogues', 'Tags', 'Exit'],
      },
    ]);

    switch (answers.menuChoice) {
      case 'Images':
        await imagesMenu();
        break;
      case 'Catalogues':
        await cataloguesMenu();
        break;
      case 'Tags':
        await tagsMenu();
        break;
      case 'Exit':
        return;
      default:
        console.log('Invalid choice');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

mainMenu();
