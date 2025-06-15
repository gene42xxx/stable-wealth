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

        if (!name || !email || !password) {
            return NextResponse.json({ message: 'Please provide name, email, and password' }, { status: 400 });
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

        let newUserRole = 'user'; // Default role
        let referredByAdminId = null;
        let refCode = null;

        if (referralCode) {
            // Find the referral code
            refCode = await ReferralCode.findOne({ code: referralCode });

            if (!refCode) {
                return NextResponse.json({ message: 'Invalid referral code' }, { status: 400 });
            }

            if (refCode.expiresAt && new Date() > refCode.expiresAt) {
                return NextResponse.json({ message: 'Referral code has expired' }, { status: 400 });
            }

            newUserRole = refCode.targetRole; // 'user' or 'admin'

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

            // Mark the referral code as used ONLY if the target role is 'user' AND a referral code was provided
            if (refCode && newUserRole === 'user') {
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
        // Determine actorId for logging: if a referral code was used, it's the creator of the code. Otherwise, it's the new user.
        const actorId = refCode ? refCode.createdBy : newUser._id;
        const details = `New ${newUserRole} registered: ${newUser.email}${refCode ? ` (via referral code: ${refCode.code})` : ''}`;
        
        await logActivity(
            actorId,
            'user_create',
            details,
            newUser._id
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
