import NextAuth from 'next-auth';
import { authOptions } from '../auth-options';

// Create the handler using the imported auth options
const handler = NextAuth(authOptions);

// Export only valid route handlers
export { handler as GET, handler as POST };
