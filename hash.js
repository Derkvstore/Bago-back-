const bcrypt = require('bcrypt');

bcrypt.hash('66442740Med', 10).then(hash => {
  console.log('Hash généré :', hash);
});
