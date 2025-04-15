// hash-password.js
const bcrypt = require('bcrypt');

const plainPassword = 'admin4321';
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
    if (err) throw err;
    console.log('해시된 비밀번호:', hash);
});
