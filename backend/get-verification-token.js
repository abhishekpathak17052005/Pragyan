/**
 * Helper script to get verification token from MongoDB
 * Usage: node get-verification-token.js <email>
 */

const { MongoClient } = require('mongodb');

const mongoUrl = 'mongodb+srv://ap17052005_db_user:Pragyan123@cluster0.7fsqglj.mongodb.net/Pragyan?retryWrites=true&w=majority';
const email = process.argv[2];

if (!email) {
  console.error('Usage: node get-verification-token.js <email>');
  process.exit(1);
}

async function getToken() {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db('Pragyan');
    
    // First, get the user
    const user = await db.collection('User').findOne({ email });
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`User found: ${user.email}`);
    console.log(`Account status: ${user.accountStatus}`);
    console.log('');
    
    // Get the verification token
    const token = await db.collection('VerificationToken').findOne({
      userId: user._id,
      usedAt: null // Not yet used
    });
    
    if (!token) {
      console.error('No unused verification token found');
      process.exit(1);
    }
    
    console.log('Verification Token (raw):');
    console.log(token._id.toString());
    console.log('');
    console.log('Token Hash:');
    console.log(token.tokenHash);
    console.log('');
    console.log('Expires At:');
    console.log(token.expiresAt);
    console.log('');
    console.log('NOTE: The token stored in DB is hashed. The original token was sent via email.');
    console.log('For testing, you can use the token ID as a fallback.');
    
  } finally {
    await client.close();
  }
}

getToken().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
