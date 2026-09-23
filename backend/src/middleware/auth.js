const { verifyIdToken } = require('../config/firebase');
const repo = require('../db/repository');

/**
 * Main Authentication Middleware
 * Validates Firebase Bearer token and resolves user record & role.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Unauthorized: Missing or invalid Authorization header. Expected Bearer token.',
          status: 401
        }
      });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    if (!idToken) {
      return res.status(401).json({
        error: {
          message: 'Unauthorized: Token string is empty.',
          status: 401
        }
      });
    }

    // 1. Verify token
    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (tokenErr) {
      return res.status(401).json({
        error: {
          message: `Authentication failed: ${tokenErr.message}`,
          status: 401
        }
      });
    }

    const firebaseUid = decoded.uid;

    // 2. If verified token has ADMIN role, resolve/provision as Admin
    if (decoded.role === 'ADMIN') {
      let adminUser = await repo.findAdminByFirebaseUid(firebaseUid);
      if (!adminUser) {
        adminUser = await repo.createAdmin({
          firebase_uid: firebaseUid,
          name: decoded.name || decoded.email.split('@')[0],
          email: decoded.email
        });
      }
      req.user = {
        id: adminUser.id,
        firebase_uid: adminUser.firebase_uid,
        name: adminUser.name,
        email: adminUser.email,
        role: 'ADMIN'
      };
      req.role = 'ADMIN';
      return next();
    }

    // 3. Otherwise, check if user exists in Admins table (e.g. database-managed admin)
    const adminUser = await repo.findAdminByFirebaseUid(firebaseUid);
    if (adminUser) {
      req.user = {
        id: adminUser.id,
        firebase_uid: adminUser.firebase_uid,
        name: adminUser.name,
        email: adminUser.email,
        role: 'ADMIN'
      };
      req.role = 'ADMIN';
      return next();
    }

    // 4. Resolve or auto-provision as Doctor
    let doctorUser = await repo.findDoctorByFirebaseUid(firebaseUid);
    if (!doctorUser) {
      doctorUser = await repo.createDoctor({
        firebase_uid: firebaseUid,
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        tablet_id: req.headers['x-tablet-id'] || 'TABLET-DEFAULT'
      });
    }

    req.user = {
      id: doctorUser.id,
      firebase_uid: doctorUser.firebase_uid,
      name: doctorUser.name,
      email: doctorUser.email,
      phone: doctorUser.phone,
      tablet_id: doctorUser.tablet_id,
      role: 'DOCTOR'
    };
    req.role = 'DOCTOR';
    return next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return res.status(500).json({
      error: {
        message: 'Internal server error during authentication verification',
        status: 500
      }
    });
  }
}

/**
 * Middleware: Require specific role(s)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.role) {
      return res.status(401).json({
        error: { message: 'Unauthorized: User authentication required', status: 401 }
      });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        error: {
          message: `Forbidden: Access restricted. Requires one of [${allowedRoles.join(', ')}], current role is [${req.role}].`,
          status: 403
        }
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
