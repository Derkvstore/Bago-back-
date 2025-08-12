const bcrypt = require('bcrypt');

bcrypt.hash('Bago6888', 10).then(hash => {
  console.log('Hash généré :', hash);
});
