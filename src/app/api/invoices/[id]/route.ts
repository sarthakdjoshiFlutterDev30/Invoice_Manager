import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import '@/models/Client';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;

    const invoice = await Invoice.findOne({ _id: id, createdBy: user!.id })
      .populate('client', 'name email address gstin');

    if (!invoice) return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: invoice });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return NextResponse.json({ success: false, message: 'Error fetching invoice' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const data = await req.json();

    // Payment recording
    if (data.status === 'paid' || data.status === 'partial') {
      const invoiceDoc = await Invoice.findOne({ _id: id, createdBy: user!.id });
      if (!invoiceDoc) return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });

      const netPayable = invoiceDoc.total - ((invoiceDoc.subtotal || 0) * 0.1);
      const paymentId = `PAY-${invoiceDoc.invoiceNumber}-${Date.now().toString().slice(-6)}`;
      const paidAmount = typeof data.paidAmount === 'number' ? data.paidAmount : netPayable;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previousHistory = (invoiceDoc.paymentHistory || []).map((p: any) => p.toObject ? p.toObject() : p);
      const previouslyPaid = previousHistory.reduce((sum: number, p: { amount?: number }) => sum + (p.amount || 0), 0);
      const totalPaid = previouslyPaid + paidAmount;
      const newStatus = totalPaid >= (netPayable - 0.01) ? 'paid' : 'partial';

      const newEntry = {
        paymentId,
        method: data.paymentMethod || 'bank_transfer',
        referenceNo: data.referenceNo || '',
        amount: paidAmount,
        currency: 'INR',
        status: newStatus === 'paid' ? 'captured' : 'partial',
        paidAt: new Date(),
      };

      data.paymentDetails = newEntry;
      data.status = newStatus;
      data.paymentHistory = [...previousHistory, newEntry];
      delete data.paymentMethod;
      delete data.referenceNo;
      delete data.paidAmount;
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, createdBy: user!.id },
      { $set: { ...data, updatedAt: new Date() } },
      { new: true }
    ).populate('client', 'name email address gstin');

    if (!invoice) return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: invoice });
  } catch (err) {
    console.error('Error updating invoice:', err);
    return NextResponse.json({ success: false, message: 'Error updating invoice' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;

    const invoice = await Invoice.findOneAndDelete({ _id: id, createdBy: user!.id });
    if (!invoice) return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('Error deleting invoice:', err);
    return NextResponse.json({ success: false, message: 'Error deleting invoice' }, { status: 500 });
  }
}
