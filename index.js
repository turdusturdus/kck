const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let userData = {};

// Ask for name
rl.question('What is your name? ', (name) => {
  userData.name = name;

  // Ask for age
  rl.question('How old are you? ', (age) => {
    userData.age = age;

    // Ask for favorite programming language
    rl.question('What is your favorite programming language? ', (language) => {
      userData.language = language;

      // Summarize data
      console.log(`Thank you! Here is what you entered:
      Name: ${userData.name}
      Age: ${userData.age}
      Favorite Programming Language: ${userData.language}`);

      rl.close();
    });
  });
});
