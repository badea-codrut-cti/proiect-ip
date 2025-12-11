import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import('./email.js').then(({ createTransporter, sendPasswordResetEmail }) => {
  createTransporter({
    host: 'localhost',
    port: 1025,
    from: 'noreply@myapp.com'
  })
  .then(transporter => sendPasswordResetEmail(transporter, 'test@example.com', 'abc123def456'))
  .then(() => console.log('Test email sent successfully!'))
  .catch(err => console.error('Email error:', err));
});