import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import connectDB from '@/lib/mongodb'; // Adjust path
import ReferralCode from '@/models/ReferralCode'; // Adjust path

// GET /api/referral/[code] - Get details of a specific referral code (Admin/Super-Admin only)
export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
    const { code } = params;

    const referralCode = await ReferralCode.findOne({code})
    const isCreator = referralCode?.createdBy.toString() === session.user.id

    if (!isCreator && session.user.role !== 'super-admin') {
        return NextResponse.json({ message: 'Forbidden: You can only view referral codes you created' }, { status: 403 });
    }



    await connectDB();

    try {
        const referralCode = await ReferralCode.findOne({ code });
        if (!referralCode) {
            return NextResponse.json({ message: 'Referral code not found' }, { status: 404 });
        }
        return NextResponse.json({ referralCode }, { status: 200 });
    } catch (error) {
        console.error(`API Error fetching referral code ${code}:`, error);
        return NextResponse.json({ message: 'Error fetching referral code', error: error.message }, { status: 500 });
    }
}

// DELETE /api/referral/[code] - Delete a specific referral code (Admin/Super-Admin only)
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    const { code } = params;

    if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    try {
        // First, find the referral code to check ownership
        const referralCodeToDelete = await ReferralCode.findOne({ code }).populate('createdBy', '_id');

        if (!referralCodeToDelete) {
            return NextResponse.json({ message: 'Referral code not found' }, { status: 404 });
        }

        // Check if user is authorized to delete this code
        // Only super-admin or the creator of the code can delete it
        const isSuperAdmin = session.user.role === 'super-admin';
        const isCreator = referralCodeToDelete.createdBy &&
            referralCodeToDelete.createdBy._id &&
            referralCodeToDelete.createdBy._id.toString() === session.user.id;

        if (!isSuperAdmin && !isCreator) {
            return NextResponse.json({
                message: 'Forbidden: You can only delete referral codes you created'
            }, { status: 403 });
        }

        const referralCode = await ReferralCode.findOneAndDelete({ code });
        if (!referralCode) {
            return NextResponse.json({ message: 'Referral code not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Referral code deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`API Error deleting referral code ${code}:`, error);
        return NextResponse.json({ message: 'Error deleting referral code', error: error.message }, { status: 500 });
    }
}
