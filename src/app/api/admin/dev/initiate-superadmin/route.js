// app/api/dev/create-initial-referral/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReferralCode from '@/models/ReferralCode';
import crypto from 'crypto';
import User from '@/models/User';
import bcrypt from 'bcryptjs'





// Only allow this in development environment
const isDevelopment = process.env.NODE_ENV === 'development';



async function generateUniqueReferralCode(targetRole) {
    let code;
    let isUnique = false;
    let prefix = targetRole === 'admin' ? 'ADMIN-' : 'INV-';

    while (!isUnique) {
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        code = prefix + randomPart;
        const existingCode = await ReferralCode.findOne({ code });
        if (!existingCode) {
            isUnique = true;
        }
    }

    return code;
} 
export async function POST(request) {
    if (!isDevelopment) {
        return NextResponse.json({ message: 'This endpoint is only available in development mode' }, { status: 403 });
    }

    await connectDB();

    try {
        // Find or create a dev admin user to be the creator
        let adminUser = await User.findOne({ email: 'hopekumordzie@gmail.com' });

        if (!adminUser) {
            // Create a dev admin if none exists
            adminUser = new User({
                email: 'hopekumordzie@gmail.com',
                name: 'Hope Admin',
                password: 'kumordzie', // pre-save method in user model hashes this password
                role: 'super-admin',
                // Other required fields
            });
            await adminUser.save();
        }

        const { targetRole = 'admin', expiresInDays } = await request.json().catch(() => ({}))

        // Use the actual admin user ID
        const newReferralCode = new ReferralCode({
            code: await generateUniqueReferralCode(targetRole),
            createdBy: adminUser._id, // Use real admin ID
            targetRole: targetRole,
            expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
        });

        await newReferralCode.save();

        return NextResponse.json({
            message: `Development referral code created successfully`,
            referralCode: newReferralCode
        }, { status: 201 });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ message: 'An error occurred', error: error.message }, { status: 500 });
    }
}