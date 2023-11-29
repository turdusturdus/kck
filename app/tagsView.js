import axios from 'axios';
import FormData from 'form-data';
import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-tree-selection-prompt';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { cataloguesMenu } from './cataloguesView.js';
import { imagesMenu } from './imagesView.js';

inquirer.registerPrompt('file-tree-selection', fileSelector);

export async function tagsMenu() {
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