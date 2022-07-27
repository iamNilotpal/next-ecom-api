const API_ROUTES = [
  {
    endpoint: '/register',
    description: 'Register User',
    method: 'POST',
    dataNeeded: [
      'First name',
      'Last name',
      'Email',
      'Phone',
      'Password',
      'Address',
    ],
  },
  {
    endpoint: '/login',
    method: 'POST',
    description: 'Login User',
    dataNeeded: ['Email', 'Password'],
  },
  {
    endpoint: '/logout',
    method: 'GET',
    description: 'Logout current logged in user.',
  },
  {
    endpoint: '/refresh-token',
    method: 'GET',
    description: 'Refresh the access and refresh tokens.',
  },
  {
    endpoint: '/products',
    method: 'GET',
    description: 'Get all products.',
  },
  {
    endpoint: '/cart',
    method: 'GET',
    description: 'Get current user cart.',
  },
  {
    endpoint: '/add-to-cart',
    method: 'POST',
    description: 'Adds product to user cart.',
    dataNeeded: ['Product ID', 'Quantity'],
  },
  {
    endpoint: '/update-cart',
    method: 'PATCH',
    description: 'Updates cart data.',
    dataNeeded: ['Product ID', 'Quantity', 'Operation Type'],
  },
  {
    endpoint: '/remove',
    method: 'DELETE',
    description: "Deletes the user's cart",
  },
  {
    endpoint: '/remove',
    method: 'DELETE',
    description: 'Deletes a particular product from user cart.',
    dataNeeded: 'Product Id',
  },
  {
    endpoint: '/clear-cart',
    method: 'DELETE',
    description: "Deletes the user's cart",
  },
  {
    endpoint: '/personal-info',
    method: 'PATCH',
    description: "Updates user's personal info.",
    dataNeeded:
      'Client can provide details such as phone no, first name, last name etc.',
  },
  {
    endpoint: '/update-password',
    method: 'PATCH',
    description: "Updates current user's password.",
    dataNeeded: ['Old Password', 'New Password'],
  },
  {
    endpoint: '/delete-account',
    method: 'DELETE',
    description: 'Deletes user account.',
  },
  {
    endpoint: '/request-reset-password',
    method: 'POST',
    description: 'Creates a session for user to reset password.',
    dataNeeded: 'User email.',
  },
  {
    endpoint: '/request-reset-password',
    method: 'POST',
    description:
      "Creates a session for user to reset password and sends an otp to user's email.",
    dataNeeded: 'User email.',
  },
  {
    endpoint: '/verify-reset-password',
    method: 'POST',
    description: 'OTP is verified.',
    dataNeeded: 'OTP sent the clients email.',
  },
  {
    endpoint: '/reset-password',
    method: 'POST',
    description: 'Resets user password.',
    dataNeeded: 'New password.',
  },
];

module.exports = API_ROUTES;
