const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model (simplified for seeding)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  companyDetails: {
    name: { type: String, default: 'Bytesflare Infotech' },
    gstin: { type: String, default: '29ABCDE1234F1Z5' },
    pan: { type: String, default: 'ABCDE1234F' },
    address: { type: String, default: '123 Tech Park, Bangalore, Karnataka 560001' },
    phone: { type: String, default: '+91 9876543210' },
    email: { type: String, default: 'info@bytesflare.com' },
    bankDetails: {
      accountName: { type: String, default: 'Bytesflare Infotech Pvt Ltd' },
      accountNumber: { type: String, default: '1234567890123456' },
      bankName: { type: String, default: 'HDFC Bank' },
      ifsc: { type: String, default: 'HDFC0001234' },
    },
    upiId: { type: String, default: 'bytesflare@paytm' },
  },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', UserSchema);

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://joshisarthak556:Sart9426@cluster0.abjmdff.mongodb.net/InvoiceManagement');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@bytesflare.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@bytesflare.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@bytesflare.com',
      password: 'admin123',
      role: 'admin',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@bytesflare.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
