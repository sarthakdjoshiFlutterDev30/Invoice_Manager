import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Invoice from '@/models/Invoice';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();

    if (!mongoose.models.Client) {
      mongoose.model('Client', new mongoose.Schema({
        name: String, email: String, phone: String,
        address: String, gstin: String,
        createdBy: mongoose.Schema.Types.ObjectId,
        createdAt: { type: Date, default: Date.now },
      }));
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: Record<string, unknown> = { createdBy: user!.id };
    if (status) query.status = status;
    if (clientId) query.client = clientId;
    if (startDate && endDate) {
      query.issueDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const invoices = await Invoice.find(query)
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return NextResponse.json({ success: false, message: 'Error fetching invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();

    const data = await req.json();

    if (!data.invoiceNumber) {
      const lastInvoice = await Invoice.findOne({ createdBy: user!.id }).sort({ createdAt: -1 });
      const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
      data.invoiceNumber = `INV-${String(lastNumber + 1).padStart(4, '0')}`;
    }

    data.createdBy = user!.id;

    const invoice = await Invoice.create(data);
    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (err) {
    console.error('Error creating invoice:', err);
    return NextResponse.json({ success: false, message: 'Error creating invoice' }, { status: 500 });
  }
}
