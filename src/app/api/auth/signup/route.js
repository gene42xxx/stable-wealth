import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb'; // Adjust path as needed
import User from '@/models/User'; // Adjust path as needed
import ReferralCode from '@/models/ReferralCode'; // Adjust path as needed
import mongoose from 'mongoose';
import { logActivity } from '@/lib/utils/logActivity'; // Import the modified logActivity

export async function POST(request) {
    await connectDB();

    try {
        const { name, email, password, referralCode } = await request.json();

        if (!name || !email || !password || !referralCode) {
            return NextResponse.json({ message: 'Please provide name, email, password, and referral code' }, { status: 400 });
        }

        // Validate password length (optional, but good practice)
        if (password.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists with this email' }, { status: 400 });
        }

        // Find the referral code
        const refCode = await ReferralCode.findOne({ code: referralCode });

        if (!refCode) {
            return NextResponse.json({ message: 'Invalid referral code' }, { status: 400 });
        }


        if (refCode.expiresAt && new Date() > refCode.expiresAt) {
            return NextResponse.json({ message: 'Referral code has expired' }, { status: 400 });
        }

        // Determine the role and referring admin based on the code
        const newUserRole = refCode.targetRole; // 'user' or 'admin'
        let referredByAdminId = null;

        // If registering a 'user', the creator of the code must be an 'admin'
        if (newUserRole === 'user') {
            const codeCreator = await User.findById(refCode.createdBy);
            if (!codeCreator || codeCreator.role !== 'admin') {
                return NextResponse.json({ message: 'Invalid referral code origin for user registration' }, { status: 400 });
            }
            referredByAdminId = codeCreator._id;
        }
        // If registering an 'admin', the creator of the code must be a 'super-admin'
        else if (newUserRole === 'admin') {
            const codeCreator = await User.findById(refCode.createdBy);
            if (!codeCreator || codeCreator.role !== 'super-admin') {
                return NextResponse.json({ message: 'Invalid referral code origin for admin registration' }, { status: 400 });
            }
            // Admins are not referred by anyone in this structure
        } else {
            return NextResponse.json({ message: 'Invalid target role for referral code' }, { status: 400 });
        }


        // Use a transaction for atomicity
        const session = await mongoose.startSession();
        session.startTransaction();

        let newUser;
        try {
            // Create the new user
            newUser = new User({
                name,
                email,
                password, // Hashing is handled by the pre-save hook in User model
                role: newUserRole,
                referredByAdmin: referredByAdminId,
            });
            await newUser.save({ session });

            // Mark the referral code as used ONLY if the target role is 'user'
            if (newUserRole === 'user') {
                refCode.usedBy = newUser._id;
                refCode.expiresAt = new Date(); // Expire immediately after use
                await refCode.save({ session });
            }

            // If a user was created by an admin, add the new user to the admin's createdUsers list
            if (newUserRole === 'user' && referredByAdminId) {
                await User.findByIdAndUpdate(referredByAdminId, { $push: { createdUsers: newUser._id } }, { session });
            }

            await session.commitTransaction();

        } catch (error) {
            await session.abortTransaction();
            console.error("Registration Transaction Error:", error);
            // Check for duplicate key error specifically (e.g., if email uniqueness fails despite initial check)
            if (error.code === 11000) {
                return NextResponse.json({ message: 'An account with this email might already exist.' }, { status: 409 }); // 409 Conflict
            }
            return NextResponse.json({ message: 'Registration failed during transaction', error: error.message }, { status: 500 });
        } finally {
            session.endSession();
        }

        // Log the successful registration activity AFTER the transaction is committed
        // We need the ID of the user who *created* the referral code if it was an admin creating a user
        const actorId = newUserRole === 'user' ? referredByAdminId : newUser._id; // If admin registers admin, actor is the new admin? Or should it be super-admin? Needs clarification. Assuming actor is creator for now.
        const details = `${newUserRole === 'user' ? 'Admin' : 'Super Admin'} created ${newUserRole}: ${newUser.email}`;
        // Use await, but don't block the response if logging fails (logActivity handles its own errors)
        await logActivity(
            actorId, // The user performing the action (the admin/super-admin who owned the code)
            'user_create',
            details,
            newUser._id // The user being acted upon (the newly created user)
            // Removed IP address and user agent arguments
        );

        // Exclude password from the response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json({ message: 'User registered successfully', user: userResponse }, { status: 201 });

    } catch (error) {
        console.error("Registration API Error:", error);
        return NextResponse.json({ message: 'An error occurred during registration', error: error.message }, { status: 500 });
    }
}
