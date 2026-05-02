import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import User from '@/models/User'; // Adjust path as needed
import connectDB from '@/lib/mongodb'; // Adjust path as needed
import SubscriptionPlan from '@/models/SubscriptionPlan';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password');
        }

        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user) {
          throw new Error('Invalid credentials');
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordMatch) {
          throw new Error('Invalid credentials');
        }
        

        // Return user object without password
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
          fakeProfits: user.fakeProfits,
          plan: user.subscriptionPlan, // Assuming this is an ObjectId reference

        };
      }
    })
  ],
  session: {
    strategy: 'jwt', // Using JWT for session management
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user id and role to the JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id, role, and other necessary fields from DB to the session object
      if (token?.id) {
        session.user.id = token.id;
        session.user.role = token.role; // Role is already in the token from jwt callback

        // Fetch additional user data from DB
        try {
          await connectDB(); // Ensure DB connection
          // Fetch user and potentially populate subscription plan if needed often
          // Adjust populate based on whether subscriptionPlan ID or object is needed in session
          const dbUser = await User.findById(token.id).populate('subscriptionPlan').lean();

          if (dbUser) {
            // Add required fields to session.user
            session.user.walletAddress = dbUser.walletAddress;
            session.user.fakeProfits = dbUser.fakeProfits;
            session.user.name = dbUser.name; // Add name if not already present

            // Manually serialize the subscriptionPlan and its nested fields if it exists
            if (dbUser.subscriptionPlan) {
              const planObj = dbUser.subscriptionPlan; // Already a lean object
              session.user.subscriptionPlan = {
                ...planObj, // Spread the lean object
                _id: planObj._id.toString(), // Ensure top-level _id is string
                id: planObj._id.toString(), // Keep id consistent if used elsewhere
                creatorAdmin: planObj.creatorAdmin ? planObj.creatorAdmin.toString() : null, // Convert creatorAdmin ObjectId
                // Also serialize nested arrays like we did in other routes
                withdrawalConditions: planObj.withdrawalConditions ? {
                    ...planObj.withdrawalConditions,
                    penalties: planObj.withdrawalConditions.penalties ?
                        planObj.withdrawalConditions.penalties.map(p => ({ ...p, _id: p._id ? p._id.toString() : undefined })) : []
                } : undefined,
                bonusRateThresholds: planObj.bonusRateThresholds ?
                    planObj.bonusRateThresholds.map(t => ({ ...t, _id: t._id ? t._id.toString() : undefined })) : []
              };
            } else {
              session.user.subscriptionPlan = null; // Ensure it's null if not populated
            }
            
            // Add any other fields needed frequently on the client-side session
          } else {
             console.error(`Session Callback: User not found in DB for token ID: ${token.id}`);
             // Handle case where user might exist in token but not DB?
             // Depending on strategy, might want to invalidate session or return default session
          }
        } catch (error) {
            console.error("Session Callback Error fetching user data:", error);
            // Return session without extra data if DB fetch fails
        }
      } else {
         console.warn("Session Callback: Token or token.id missing.");
      }
      return session; // Return the modified session
    }
  },
  pages: {
    signIn: '/auth/signin', // Redirect users to custom sign-in page
    // error: '/auth/error', // Optional: Custom error page
    // signOut: '/auth/signout', // Optional: Custom sign-out page
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure NEXTAUTH_SECRET is set in your .env.local
  debug: process.env.NODE_ENV === 'development', // Enable debug messages in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
