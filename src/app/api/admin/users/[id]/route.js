import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import connectDB from '@/lib/mongodb'; // Adjust path
import User from '@/models/User'; // Adjust path
import mongoose from 'mongoose';

// GET /api/users/[id] - Get specific user details (Admin/Super-Admin or self)
export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Allow admins/super-admins OR the user themselves to fetch their data
    if (!session || (!['admin', 'super-admin'].includes(session.user?.role) && session.user?.id !== id)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    try {
        const user = await User.findById(id).select('-password'); // Exclude password
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error(`API Error fetching user ${id}:`, error);
        return NextResponse.json({ message: 'Error fetching user', error: error.message }, { status: 500 });
    }
}

// PUT /api/users/[id] - Update user details (Admin/Super-Admin or self)
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    const { id } = params;
    const updates = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Allow admins/super-admins OR the user themselves to update their data
    if (!session || (!['admin', 'super-admin'].includes(session.user?.role) && session.user?.id !== id)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Prevent non-admins from changing critical fields like role, balance, etc.
    if (session.user?.id === id && !['admin', 'super-admin'].includes(session.user?.role)) {
        delete updates.role;
        delete updates.fakeProfits;
        delete updates.subscriptionPlan;
        // Add other restricted fields as needed
    }
    // Prevent changing password via this route (use change-password endpoint)
    delete updates.password;

    await connectDB();

    try {
        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'User updated successfully', user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error(`API Error updating user ${id}:`, error);
        // Handle validation errors specifically
        if (error instanceof mongoose.Error.ValidationError) {
             return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Error updating user', error: error.message }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete a user (Admin/Super-Admin only)
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    const { id } = params;

     if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    // Only admins/super-admins can delete users
    if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Prevent users from deleting their own account
    if (session.user?.id === id) {
        return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    await connectDB();

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        // Consider cleanup: remove from referredByAdmin lists, mark referral codes, etc. (complex)
        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`API Error deleting user ${id}:`, error);
        return NextResponse.json({ message: 'Error deleting user', error: error.message }, { status: 500 });
    }
}
