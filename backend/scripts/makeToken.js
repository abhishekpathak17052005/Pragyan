const jwt = require('jsonwebtoken');
const payload = {
  id: '000000000000000000000001',
  userId: '000000000000000000000001',
  email: 'test@example.com',
  role: 'STUDENT',
  ver: 1,
};
console.log(jwt.sign(payload, 'your_jwt_secret_key_change_in_production', { expiresIn: '7d' }));
