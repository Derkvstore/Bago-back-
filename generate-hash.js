const bcrypt = require('bcrypt');

bcrypt.hash('Yatt6888', 10).then(hash => {
  console.log('Hash généré :', hash);
});
