import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import connectDB from '@/lib/mongodb'; // Adjust path as needed
import User from '@/models/User'; // Adjust path as needed
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  // 1. Authentication Check: Ensure user is logged in
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
  }

  await connectDB();

  try {
    const { currentPassword, newPassword } = await request.json();
    const userId = session.user.id;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Please provide current and new passwords' }, { status: 400 });
    }

    // Validate new password length
    if (newPassword.length < 8) {
        return NextResponse.json({ message: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    // 2. Fetch User (including password)
    const user = await User.findById(userId).select('+password');

    if (!user) {
      // This shouldn't happen if the session is valid, but good to check
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // 3. Verify Current Password
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Incorrect current password' }, { status: 401 }); // Unauthorized or Bad Request (400) could also fit
    }

    // 4. Hash and Update New Password
    // Hashing will be handled by the pre-save hook if we save the document
    // Alternatively, hash manually and use findByIdAndUpdate
    user.password = newPassword; // Assign the new password, pre-save hook will hash it
    await user.save();

    // Or manual hashing:
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);
    // await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });

  } catch (error) {
    console.error("Change Password API Error:", error);
    return NextResponse.json({ message: 'An error occurred while changing password', error: error.message }, { status: 500 });
  }
}
