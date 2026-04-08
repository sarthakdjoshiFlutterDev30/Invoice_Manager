import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import '@/models/Client'; // Ensure Client schema is registered for populate

// GET single invoice
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    const { id } = await params;

    const invoice = await Invoice.findOne({
      _id: id,
      createdBy: defaultUserId
    }).populate('client', 'name email address gstin');
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching invoice' },
      { status: 500 }
    );
  }
}

// PATCH update invoice
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    const { id } = await params;

    const data = await req.json();

    // ── Payment recording: partial or full ─────────────────────
    if (data.status === 'paid' || data.status === 'partial') {
      const invoiceDoc = await Invoice.findOne({ _id: id, createdBy: defaultUserId });
      if (!invoiceDoc) {
        return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
      }

      const netPayable = invoiceDoc.total - ((invoiceDoc.subtotal || 0) * 0.1);
      const paymentId  = `PAY-${invoiceDoc.invoiceNumber}-${Date.now().toString().slice(-6)}`;
      const method     = data.paymentMethod || 'bank_transfer';
      const referenceNo = data.referenceNo || '';
      const paidAmount  = typeof data.paidAmount === 'number' ? data.paidAmount : netPayable;

      // Build the FULL history array in JS
      const previousHistory = invoiceDoc.paymentHistory ? invoiceDoc.paymentHistory.map((p: any) => p.toObject ? p.toObject() : p) : [];
      const previouslyPaid = previousHistory.reduce(
        (sum: number, p: any) => sum + (p.amount || 0), 0
      );
      const totalPaidAfterThis = previouslyPaid + paidAmount;

      // Determine new status
      const newStatus = totalPaidAfterThis >= (netPayable - 0.01) ? 'paid' : 'partial';
      const entryStatus = newStatus === 'paid' ? 'captured' : 'partial';

      const newEntry = {
        paymentId,
        method,
        referenceNo,
        amount: paidAmount,
        currency: 'INR',
        status: entryStatus,
        paidAt: new Date(),
      };

      // paymentDetails = latest payment; paymentHistory = all payments
      data.paymentDetails = newEntry;
      data.status         = newStatus;
      data.paymentHistory = [...previousHistory, newEntry];

      // Remove helper fields
      delete data.paymentMethod;
      delete data.referenceNo;
      delete data.paidAmount;
    }

    const updateOp: any = {
      $set: { ...data, updatedAt: new Date() },
    };

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, createdBy: defaultUserId },
      updateOp,
      { new: true }
    ).populate('client', 'name email address gstin');
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating invoice' },
      { status: 500 }
    );
  }
}

// DELETE invoice
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Use default user ID for direct access
    const defaultUserId = '68f601d13b9fdf3a0dce46a7';
    const { id } = await params;

    const invoice = await Invoice.findOneAndDelete({
      _id: id,
      createdBy: defaultUserId
    });
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Invoice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting invoice' },
      { status: 500 }
    );
  }
}
