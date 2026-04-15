import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const dbUser = await User.findById(user!.id);
    if (!dbUser) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: dbUser.companyDetails });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, error } = requireAuth(req.headers);
  if (error) return NextResponse.json(error, { status: 401 });

  try {
    await connectDB();
    const body = await req.json();

    const dbUser = await User.findByIdAndUpdate(
      user!.id,
      { $set: { companyDetails: body } },
      { new: true, runValidators: true }
    );

    if (!dbUser) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: dbUser.companyDetails, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
