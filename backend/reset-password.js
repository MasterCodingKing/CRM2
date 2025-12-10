// Direct Password Reset Script
const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function resetPassword(email, newPassword) {
  console.log('\n=================================');
  console.log('Password Reset');
  console.log('=================================\n');
  
  try {
    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }

    console.log('✓ User found:', user.email);
    console.log('✓ Role:', user.role);
    console.log('\nGenerating new password hash...');
    
    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await user.update({ 
      password_hash: hash,
      updated_at: new Date()
    });
    
    console.log('\n✅ Password reset successful!\n');
    console.log('New Credentials:');
    console.log('  Email:', email);
    console.log('  Password:', newPassword);
    console.log('\nYou can now login with these credentials.\n');
    
    // Verify the new password works
    const isValid = await bcrypt.compare(newPassword, hash);
    console.log('Verification:', isValid ? '✅ Password verified' : '❌ Verification failed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Get arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('\nUsage: node reset-password.js <email> <new-password>');
  console.log('Example: node reset-password.js user@gmail.com newpassword123\n');
  process.exit(1);
}

resetPassword(email, newPassword);
