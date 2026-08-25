export default function logout (){
   try {
    // Clear the user's session or authentication token
    // For example, if using JWT, you might want to invalidate the token on the client side
    // If using sessions, you would destroy the session here
   } catch (error) {
    console.error('Error during logout:', error);
    return { success: false, message: "An error occurred during logout" };
   }
};
