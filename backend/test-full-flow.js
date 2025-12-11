// Test signup with email
fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'Test123!'
  })
})
.then(res => res.json())
.then(data => console.log(`Signup: ${JSON.stringify(data)}`))
.then(() => testPasswordReset())
.catch(err => console.error('Signup error:', err));

// Test password reset
function testPasswordReset() {
  fetch('http://localhost:5000/api/auth/request-password-reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'testuser@example.com'
    })
  })
  .then(res => res.status)
  .then(status => console.log(`Password reset request status: ${status}`))
  .catch(err => console.error('Password reset error:', err));
}