import axios from 'axios';
import FormData from 'form-data';
import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-tree-selection-prompt';
import path from 'path';
import fs from 'fs';
import os from 'os';
import Chartscii from 'chartscii';
import { mainMenu } from './index.js';

inquirer.registerPrompt('file-tree-selection', fileSelector);

async function tagLogs() {
  try {
    const response = await axios.get('http://localhost:3000/tags/logs');
    const logs = response.data;

    if (!logs) {
      console.log('No log data available.');
    } else {
      console.log('Tagging Logs:\n', logs);
    }
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

async function tagStatistics() {
  try {
    const response = await axios.get('http://localhost:3000/tags/statistics');
    const tagStatistics = response.data;

    if (Object.keys(tagStatistics).length === 0) {
      console.log('No tag statistics available.');
    } else {
      console.log('Tag Statistics:');

      const chartData = Object.entries(tagStatistics).map(([tag, count]) => {
        return { label: `${tag} ${count}`, value: count };
      });

      const chart = new Chartscii(chartData, {
        width: 20,
        color: 'blue',
        char: '█',
        sort: true,
        reverse: true,
        labels: true,
      });

      console.log(chart.create());
    }
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

async function generateTagsForCatalogue() {
  try {
    // Fetching all catalogues
    const response = await axios.get('http://localhost:3000/catalogue');
    const catalogues = response.data;

    if (Object.keys(catalogues).length === 0) {
      console.log('No catalogues available.');
      return;
    }

    const catalogueChoices = [...Object.keys(catalogues), 'Tag All Images'];

    const { selectedCatalogue } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCatalogue',
        message: 'Select a catalogue to tag images (or select Tag All Images):',
        choices: catalogueChoices,
      },
    ]);

    let url = 'http://localhost:3000/tags/tag-images';
    if (selectedCatalogue !== 'Tag All Images') {
      url += `?catalogueName=${encodeURIComponent(selectedCatalogue)}`;
    }

    const tagResponse = await axios.post(url);
    console.log(tagResponse.data);
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

async function generateTagsForAllImages() {
  try {
    const response = await axios.post('http://localhost:3000/tags/tag-images');
    console.log(response.data);
  } catch (error) {
    console.error(
      'Error:',
      error.response ? error.response.data : error.message
    );
  }
}

export async function tagsMenu() {
  try {
    console.clear();
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
    console.clear();

    switch (answers.tagChoice) {
      case 'Generate for All Images':
        await generateTagsForAllImages();
        break;
      case 'Generate Tags for Catalogue':
        await generateTagsForCatalogue();
        break;
      case 'Statistics':
        await tagStatistics();
        break;
      case 'Logs':
        await tagLogs();
        break;
      case 'Back to Main Menu':
        mainMenu();
        return;
      default:
        console.log('Invalid choice');
    }
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...',
      },
    ]);
    await tagsMenu();
  } catch (error) {
    console.error('Error:', error);
  }
}
