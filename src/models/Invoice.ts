import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Please provide invoice number'],
    unique: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Please provide client'],
  },
  issueDate: {
    type: Date,
    required: [true, 'Please provide issue date'],
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide due date'],
  },
  items: [
    {
      description: {
        type: String,
        required: [true, 'Please provide item description'],
      },
      quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
        min: [1, 'Quantity cannot be less than 1'],
      },
      rate: {
        type: Number,
        required: [true, 'Please provide rate'],
        min: [0, 'Rate cannot be negative'],
      },
      gstPercentage: {
        type: Number,
        required: [true, 'Please provide GST percentage'],
        enum: [0, 5, 12, 18, 28],
        default: 18,
      },
      amount: {
        type: Number,
        required: [true, 'Please provide amount'],
      },
    },
  ],
  subtotal: {
    type: Number,
    required: [true, 'Please provide subtotal'],
  },
  gstAmount: {
    type: Number,
    required: [true, 'Please provide GST amount'],
  },
  total: {
    type: Number,
    required: [true, 'Please provide total'],
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'partial', 'cancelled'],
    default: 'unpaid',
  },
  paymentDetails: {
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'cash', 'upi', 'other'],
    },
    transactionId: {
      type: String,
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
    },
    paidAt: {
      type: Date,
    },
  },
  notes: {
    type: String,
  },
  termsAndConditions: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);