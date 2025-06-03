import connectDB from '@/lib/mongodb'; // Import DB connection
import Activity from '@/models/Activity'; // Import Activity model

/**
 * Logs an activity directly to the database.
 * Intended for use on the server-side (e.g., within API routes).
 * 
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} action - The type of action performed (enum from Activity model).
 * @param {string} details - A description of the activity.
 * @param {string|null} [targetUserId=null] - Optional ID of the user being acted upon.
 */
// Removed ipAddress and userAgent parameters
export async function logActivity(userId, action, details, targetUserId = null) {
  try {
    await connectDB(); // Ensure database connection

    const activityData = {
      user: userId,
      action,
      details,
    };

    if (targetUserId) {
      activityData.targetUser = targetUserId;
    }
    // Removed ipAddress and userAgent logic

    console.log('Attempting to log activity:', activityData); // Add log before create
    const newActivity = await Activity.create(activityData);
    console.log(`Activity logged successfully: User ${userId}, Action: ${action}, ID: ${newActivity._id}`);
    return true; // Return true on success
  } catch (error) {
    // Log the error AND re-throw it so the caller is aware.
    console.error('Error logging activity directly:', error);
    throw error; // Re-throw the error
  }
}

// Keep the old fetch-based function commented out or remove if definitely not needed client-side
/*
export async function logActivityViaApi(userId, action, details, targetUserId = null) {
  try {
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        action,
        details,
        targetUserId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to log activity via API');
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging activity via API:', error);
    throw error;
  }
}
*/
