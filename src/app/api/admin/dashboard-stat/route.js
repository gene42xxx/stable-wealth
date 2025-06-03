import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ReferralCode from '@/models/ReferralCode';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust path as needed
import mongoose from 'mongoose'; // Import mongoose

export async function GET(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super-admin'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let usersQuery = {}; // Default to no filter

    if (session.user.role === 'admin') {
      // For regular admins, filter users by the admin's own user ID in the referredByAdmin field
      // Ensure session.user.id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
        console.warn(`Admin Dashboard Stat API: Invalid admin ID in session: ${session.user.id}`);
        return NextResponse.json({ message: 'Invalid admin ID in session' }, { status: 400 });
      }
      usersQuery = { referredByAdmin: new mongoose.Types.ObjectId(session.user.id) };
      console.log(`Admin Dashboard Stat API: Admin role detected. Filtering by referredByAdmin: ${session.user.id}`);
    } else {
      console.log("Admin Dashboard Stat API: Super-Admin role detected. Fetching all users.");
    }

    // Fetch all users based on the constructed query
    const allUsers = await User.find(usersQuery);
    console.log(`Admin Dashboard Stat API: Found ${allUsers.length} users for stats.`);
    // console.log("Admin Dashboard Stat API: Users data:", allUsers); // Uncomment for detailed user data inspection

    const totalUsers = allUsers.length;
    const activeSubscriptions = allUsers.filter(user => user.subscription?.isActive).length;

    // Calculate new users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = allUsers.filter(user => user.createdAt >= thirtyDaysAgo).length;

    // Calculate total admins and super-admins (these counts are always global for super-admins,
    // and for regular admins, they would only count admins/super-admins they referred, which is less common/useful for these specific stats.
    // For simplicity and common dashboard use, these specific role counts are often global.
    // If the requirement is strictly "only users referred by this admin", then `allUsers` would already be filtered.
    // Assuming these specific role counts should be global for super-admins, and 0 for regular admins if not referred by them.
    const totalAdmins = allUsers.filter(user => user.role === 'admin').length;
    const totalSuperAdmins = allUsers.filter(user => user.role === 'super-admin').length;


    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      newUsersLast30Days,
      totalAdmins,
      totalSuperAdmins,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
