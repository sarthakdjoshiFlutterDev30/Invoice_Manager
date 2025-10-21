const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: './.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable in .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'accountant'],
    default: 'admin',
  },
  companyDetails: {
    name: {
      type: String,
      default: 'Bytes Flare Infotech',
    },
    gstin: {
      type: String,
      default: '29ABCDE1234F1Z5',
    },
    pan: {
      type: String,
      default: 'ABCDE1234F',
    },
    address: {
      type: String,
      default: '123 Tech Park, Bangalore, Karnataka 560001',
    },
    phone: {
      type: String,
      default: '+91 9876543210',
    },
    email: {
      type: String,
      default: 'info@bytesflare.com',
    },
    bankDetails: {
      accountName: {
        type: String,
        default: 'Bytes Flare Infotech',
      },
      accountNumber: {
        type: String,
        default: '1234567890',
      },
      bankName: {
        type: String,
        default: 'State Bank of India',
      },
      ifsc: {
        type: String,
        default: 'SBIN0000001',
      },
    },
    upiId: {
      type: String,
      default: 'bytesflare@upi',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const createDefaultUser = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    const defaultUserEmail = 'admin@bytesflare.com';
    const defaultPassword = 'admin123';

    let user = await User.findById(defaultUserId);

    if (user) {
      console.log('Default user already exists!');
      console.log('User ID:', user._id);
      console.log('Email:', user.email);
    } else {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      user = await User.create({
        _id: new mongoose.Types.ObjectId(defaultUserId),
        name: 'Bytesflare Admin',
        email: defaultUserEmail,
        password: hashedPassword,
        role: 'admin',
        companyDetails: {
          name: 'Bytes Flare Infotech',
          gstin: '29ABCDE1234F1Z5',
          pan: 'ABCDE1234F',
          address: '123 Tech Park, Bangalore, Karnataka 560001',
          phone: '+91 9876543210',
          email: 'info@bytesflare.com',
          bankDetails: {
            accountName: 'Bytes Flare Infotech',
            accountNumber: '1234567890',
            bankName: 'State Bank of India',
            ifsc: 'SBIN0000001',
          },
          upiId: 'bytesflare@upi',
        },
      });
      console.log('Default user created successfully!');
      console.log('User ID:', user._id);
      console.log('Email:', user.email);
      console.log('Password:', defaultPassword);
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createDefaultUser();
