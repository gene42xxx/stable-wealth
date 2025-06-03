import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path
import connectDB from '@/lib/mongodb'; // Adjust path
import SubscriptionPlan from '@/models/SubscriptionPlan'; // Adjust path
import User from '@/models/User'; // Adjust path
import mongoose from 'mongoose';

// GET /api/admin/subscription/[id] - Get specific plan details with role-based access
export async function GET(request, { params }) {
    const { id } = params;
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === 'super-admin';
    const isAdmin = userRole === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid plan ID format' }, { status: 400 });
    }

    await connectDB();

    try {
        let plan;

        if (isSuperAdmin) {
            // Super-admin can access any plan
            plan = await SubscriptionPlan.findById(id);
        } else if (isAdmin) {
            // Admin can only access plans they created
            plan = await SubscriptionPlan.findOne({
                _id: id,
                creatorAdmin: session.user.id
            });
        } else {
            // Regular users can only see active plans
            plan = await SubscriptionPlan.findOne({
                _id: id,
                active: true
            });
        }

        if (!plan) {
            return NextResponse.json({
                message: isAdmin ? 'Subscription plan not found or not created by you' : 'Subscription plan not found or not active'
            }, { status: 404 });
        }

        return NextResponse.json({ plan }, { status: 200 });
    } catch (error) {
        console.error(`API Error fetching plan ${id}:`, error);
        return NextResponse.json({ message: 'Error fetching subscription plan', error: error.message }, { status: 500 });
    }
}

// PUT /api/admin/subscription/[id] - Update plan details (Admin/Super-Admin only)
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    const { id } = params;
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === 'super-admin';
    const isAdmin = userRole === 'admin';


    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid plan ID format' }, { status: 400 });
    }

    if (!session || !['admin', 'super-admin'].includes(userRole)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    try {
        const updates = await request.json();
        // Add validation if needed

        let updatedPlan;

        if (isSuperAdmin) {
            // Super-admin can update any plan
            updatedPlan = await SubscriptionPlan.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true
            });
        } else if (isAdmin) {
            // Get the plan to check who created it
            const existingPlan = await SubscriptionPlan.findById(id);

            if (!existingPlan) {
                return NextResponse.json({ message: 'Subscription plan not found' }, { status: 404 });
            }

            // Find if the creator is a super-admin
            const creator = await User.findById(existingPlan.creatorAdmin);
            const isCreatedBySuperAdmin = creator?.role === 'super-admin';
            const isCreatedByCurrentAdmin = existingPlan.creatorAdmin.toString() === session.user.id;

            if (isCreatedByCurrentAdmin) {
                // Admin can fully update their own plans
                updatedPlan = await SubscriptionPlan.findByIdAndUpdate(id, updates, {
                    new: true,
                    runValidators: true
                });
            } else if (isCreatedBySuperAdmin && Object.keys(updates).length === 1 && 'active' in updates) {
                // Admin can only update the active status of super-admin created plans
                updatedPlan = await SubscriptionPlan.findByIdAndUpdate(id,
                    { active: updates.active },
                    { new: true, runValidators: true }
                );
            } else {
                return NextResponse.json({
                    message: 'You can only modify the active status of plans not created by you'
                }, { status: 403 });
            }
        }

        if (!updatedPlan) {
            return NextResponse.json({
                message: isAdmin ? 'Subscription plan not found or you do not have permission to modify it' : 'Subscription plan not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Subscription plan updated successfully',
            plan: updatedPlan
        }, { status: 200 });
    } catch (error) {
        console.error(`API Error updating plan ${id}:`, error);
        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
        }
        if (error.code === 11000) { // Handle potential unique constraint errors (e.g., name)
            return NextResponse.json({ message: 'Update failed due to unique constraint.', error: error.keyValue }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error updating subscription plan', error: error.message }, { status: 500 });
    }
}

// DELETE /api/subscription/[id] - Delete a plan (Admin/Super-Admin only)
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === 'super-admin';
    const isAdmin = userRole === 'admin';

    const planToDelete = await SubscriptionPlan.findById(id);

    if (!planToDelete) {
        return NextResponse.json({ message: 'Subscription plan not found' }, { status: 404 });
    }

    const creator = await User.findById(planToDelete.creatorAdmin);
    const isCreatedBySuperAdmin = creator?.role === 'super-admin';
    const isCreatedByCurrentAdmin = planToDelete.creatorAdmin.toString() === session.user.id;



    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid plan ID format' }, { status: 400 });
    }

    if (!session || !['admin', 'super-admin'].includes(userRole)) {
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    try {
        let deletedPlan;

        if (isSuperAdmin) {
            // Super-admin can deactivate any plan (soft delete)
            deletedPlan = await SubscriptionPlan.findByIdAndUpdate(id, { active: false }, { new: true });
        } else if (isAdmin) {
            if (!isCreatedByCurrentAdmin && !isCreatedBySuperAdmin) {
                return NextResponse.json({
                    message: 'You can only deactivate plans you created or those created by super-admins'
                }, { status: 403 });
            }
            // Admin can only deactivate plans they created
            deletedPlan = await SubscriptionPlan.findOneAndUpdate(
                { _id: id },
                { active: false },
                { new: true }
            );
        }

        if (!deletedPlan) {
            return NextResponse.json({
                message: isAdmin ? 'Subscription plan not found or not created by you' : 'Subscription plan not found'
            }, { status: 404 });
        }

        return NextResponse.json({ message: 'Subscription plan deactivated successfully' }, { status: 200 });
    } catch (error) {
        console.error(`API Error deleting plan ${id}:`, error);
        return NextResponse.json({ message: 'Error deleting subscription plan', error: error.message }, { status: 500 });
    }
}