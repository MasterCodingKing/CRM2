// Test password verification
const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function testPassword(email, plainPassword) {
  console.log('\n=================================');
  console.log('Testing Password Verification');
  console.log('=================================\n');
  console.log(`Email: ${email}`);
  console.log(`Plain Password: ${plainPassword}\n`);

  try {
    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log(`✓ User found: ${user.email}`);
    console.log(`✓ Stored hash: ${user.password_hash}\n`);

    // Test password verification
    const isValid = await user.verifyPassword(plainPassword);
    console.log(`Password verification result: ${isValid ? '✅ MATCH' : '❌ NO MATCH'}\n`);

    // Manual bcrypt compare for debugging
    const manualCheck = await bcrypt.compare(plainPassword, user.password_hash);
    console.log(`Manual bcrypt.compare result: ${manualCheck ? '✅ MATCH' : '❌ NO MATCH'}\n`);

    // Test if the stored hash is actually a plain text (common mistake)
    const isPlainText = !user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$');
    if (isPlainText) {
      console.log('⚠️  WARNING: Password hash does not look like a bcrypt hash!');
      console.log('   It appears to be stored as plain text.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node test-password.js <email> <password>');
  console.log('Example: node test-password.js user@gmail.com mypassword');
  process.exit(1);
}

testPassword(email, password);
