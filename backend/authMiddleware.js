import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'Malformed authorization header' });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET environment variable is missing');
    return res.status(500).json({ success: false, message: 'Internal server configuration error' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      }
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    if (!decoded || (!decoded.user_id && !decoded.userId)) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    const userId = Number(decoded.user_id || decoded.userId);
    if (isNaN(userId)) {
      return res.status(401).json({ success: false, message: 'Invalid user identity in token' });
    }

    req.user = { user_id: userId };
    next();
  });
}
