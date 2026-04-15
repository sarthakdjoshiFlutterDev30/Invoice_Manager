const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load .env.local first, fallback to .env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local or .env');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  companyDetails: {
    name: { type: String, default: 'Bytesflare Infotech' },
    gstin: { type: String, default: '' },
    pan: { type: String, default: '' },
    tan: { type: String, default: '' },
    cin: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    bankDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      ifsc: { type: String, default: '' },
    },
    logo: { type: String, default: '' },
  },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const DEFAULT_EMAIL = 'admin@bytesflare.com';
const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_ID = '68f601d13b9fdf3a0dce46a7';

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB\n');

    // Check by email
    let existing = await User.findOne({ email: DEFAULT_EMAIL });

    if (existing) {
      console.log('ℹ️  Admin user already exists.');
      console.log('─────────────────────────────');
      console.log('📧 Email   :', DEFAULT_EMAIL);
      console.log('🔑 Password:', DEFAULT_PASSWORD);
      console.log('🆔 User ID :', existing._id.toString());
      console.log('─────────────────────────────');
    } else {
      const adminUser = new User({
        _id: new mongoose.Types.ObjectId(DEFAULT_ID),
        name: 'Bytesflare Admin',
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
        role: 'admin',
      });

      await adminUser.save();
      console.log('🎉 Admin user created successfully!');
      console.log('─────────────────────────────────');
      console.log('📧 Email   :', DEFAULT_EMAIL);
      console.log('🔑 Password:', DEFAULT_PASSWORD);
      console.log('🆔 User ID :', adminUser._id.toString());
      console.log('─────────────────────────────────');
      console.log('⚠️  Change your password after first login!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedAdmin();
