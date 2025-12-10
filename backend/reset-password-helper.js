// Generate password hash and SQL update command
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=================================');
console.log('Password Reset Helper');
console.log('=================================\n');

rl.question('Enter the email address: ', (email) => {
  rl.question('Enter the new password: ', (password) => {
    
    const hash = bcrypt.hashSync(password, 10);
    
    console.log('\n=================================');
    console.log('Password Reset Information');
    console.log('=================================\n');
    console.log('Email:', email);
    console.log('New Password:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('\n=================================');
    console.log('SQL Command:');
    console.log('=================================\n');
    console.log(`UPDATE users SET password_hash = '${hash}', updated_at = NOW() WHERE email = '${email}';`);
    console.log('\n');
    
    rl.close();
  });
});
