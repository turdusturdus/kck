import axios from 'axios';
import FormData from 'form-data';
import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-tree-selection-prompt';
import inquirerSearchCheckbox from 'inquirer-search-checkbox';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { cataloguesMenu } from './cataloguesView.js';
import { imagesMenu } from './imagesView.js';
import { tagsMenu } from './tagsView.js';

inquirer.registerPrompt('file-tree-selection', fileSelector);
inquirer.registerPrompt('search-checkbox', inquirerSearchCheckbox);

export async function mainMenu() {
  try {
    console.clear();
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
