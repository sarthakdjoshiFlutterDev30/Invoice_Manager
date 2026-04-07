import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const defaultUserId = '68f601d13b9fdf3a0dce46a7';

export async function GET() {
  try {
    await connectDB();
    const user = await User.findById(defaultUserId);
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user.companyDetails });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const user = await User.findByIdAndUpdate(
      defaultUserId,
      { $set: { companyDetails: body } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user.companyDetails, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
