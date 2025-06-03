import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path if needed
import Activity from '@/models/Activity';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
  try { // Add top-level try block
    const session = await getServerSession(authOptions);

    // Authorization: Check if user is logged in and is an admin/super-admin
    if (!session || !['admin', 'super-admin'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    } 

    // Inner try for specific logic errors after auth check
    try { 
      await connectDB();
      console.log("[API /api/activity] Database connected."); // Log DB connection
      const adminId = session.user.id;
      const adminRole = session.user.role;
      let activities;

      // Define common population options
      const populateOptions = [
        { path: 'user', select: 'name email avatar' },
        { path: 'targetUser', select: 'name email' }
      ];

      if (adminRole === 'super-admin') {
        console.log(`[API /api/activity] Fetching all activities for super-admin: ${adminId}`);
        activities = await Activity.find({}) // Fetch all for super-admin
          .sort({ createdAt: -1 })
          .limit(50) // Using a reasonable limit
          .populate(populateOptions);
      } else if (adminRole === 'admin') {
        console.log(`[API /api/activity] Fetching activities for admin: ${adminId}`);
        // Find users referred by this admin
        const referredUsers = await User.find({ referredByAdmin: adminId });
        const referredUserIds = referredUsers.map(user => user._id);
        console.log(`[API /api/activity] Found ${referredUserIds.length} referred users`);

        // Include the admin's own activities as well
        const relevantUserIds = [adminId, ...referredUserIds];

        activities = await Activity.find({
          $or: [
            { user: { $in: relevantUserIds } },
            { targetUser: { $in: referredUserIds } }
          ]
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate(populateOptions);
      }
      console.log(`[API /api/activity] Found ${activities.length} activities. Preparing JSON response.`);
      // Explicitly set Content-Type header for the successful response
      return new NextResponse(JSON.stringify({ activities }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (logicError) { // Catch errors within the main logic
      console.error("Error during activity fetch logic:", logicError);
      return NextResponse.json(
        // Changed 'error' key to 'message' for consistency
        { message: 'Failed to process activity request', details: logicError.message },
        { status: 500 }
      );
    }
  } catch (error) { // Catch errors from session fetching or other unexpected issues
    console.error("Unhandled error in GET /api/activity:", error);
    return NextResponse.json(
      // Changed 'error' key to 'message'
      { message: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Added session check for POST as well for consistency/security
    const session = await getServerSession(authOptions);
     if (!session) { // Basic check if user needs to be logged in to POST
       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
     }

    const body = await request.json();
    await connectDB();

    // Create new activity log - Ensure body contains necessary fields (userId, action, details)
    const activity = new Activity({
      user: body.userId, // Should this be session.user.id? Depends on use case.
      action: body.action,
      details: body.details,
      targetUser: body.targetUserId // Optional
    });

    await activity.save();
    console.log(`[API /api/activity] Activity logged successfully for user: ${body.userId || session.user.id}`);

    return NextResponse.json(
      { message: 'Activity logged successfully' },
      { status: 201 }
    );
  } catch (error) {
     console.error("Error logging activity:", error); // Added console log
    return NextResponse.json(
      // Changed 'error' key to 'message' for consistency
      { message: 'Failed to log activity', details: error.message },
      { status: 500 }
    );
  }
}
