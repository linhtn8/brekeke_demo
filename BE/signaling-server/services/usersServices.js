const {
  closeDatabase,
  createUser,
  deleteUser,
  getUserById,
  getUserByUserName,
  listUsers,
  listUsersByTenant,
  updateUser,
  waitForDatabase,
} = require('../repository/usersRepository');

function normalizeUserPayload(payload, { requireId = false } = {}) {
  const normalized = {
    userId: payload.userId ? String(payload.userId).trim() : '',
    userName: payload.userName ? String(payload.userName).trim() : '',
    password: payload.password ? String(payload.password) : '',
    displayName: payload.displayName ? String(payload.displayName).trim() : '',
    phone: payload.phone ? String(payload.phone).trim() : '',
    tenant: payload.tenant ? String(payload.tenant).trim() : '',
    status: payload.status ? String(payload.status).trim() : '',
    isActive: typeof payload.isActive === 'boolean'
      ? payload.isActive
      : String(payload.isActive).toLowerCase() === 'true',
  };

  const requiredFields = ['userName', 'password', 'displayName', 'phone', 'tenant'];
  if (requireId) {
    requiredFields.push('id');
  }

  const missingField = requiredFields.find((field) => !normalized[field]);
  if (missingField) {
    const error = new Error(`${missingField} is required`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

async function validateUniqueUserName(userName, currentUserId = null) {
  const existingUser = await getUserByUserName(userName);
  if (existingUser && existingUser.id !== currentUserId) {
    const error = new Error(`userName "${userName}" already exists`);
    error.statusCode = 409;
    throw error;
  }
}

async function getAllUsers() {
  return listUsers();
}

async function getTenantUsers(tenant) {
  const normalizedTenant = String(tenant || '').trim();
  if (!normalizedTenant) {
    const error = new Error('tenant is required');
    error.statusCode = 400;
    throw error;
  }

  return listUsersByTenant(normalizedTenant);
}

async function createNewUser(payload) {
  const user = normalizeUserPayload(payload);
  user.status = 'inactive';
  user.isActive = true;

  await validateUniqueUserName(user.userName);
  return createUser(user);
}

async function updateExistingUser(userId, payload) {
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    const error = new Error(`User ${userId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const user = normalizeUserPayload({ ...payload, userId: userId }, { requireId: true });
  user.userName = existingUser.userName;
  user.status = existingUser.status;

  await validateUniqueUserName(user.userName, userId);
  return updateUser(userId, user);
}

async function loginUserByCredentials(userName, password) {
  const normalizedUserName = String(userName || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedUserName || !normalizedPassword) {
    const error = new Error('userName and password are required');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await getUserByUserName(normalizedUserName);
  if (!existingUser || existingUser.password !== normalizedPassword) {
    const error = new Error('Invalid userName or password');
    error.statusCode = 401;
    throw error;
  }

  if (!existingUser.isActive) {
    const error = new Error(`User ${existingUser.userName} is inactive`);
    error.statusCode = 403;
    throw error;
  }

  return updateUser(existingUser.id, {
    ...existingUser,
    status: 'active',
  });
}

async function markUserOffline(userId) {
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    return null;
  }

  return updateUser(userId, {
    ...existingUser,
    status: 'inactive',
  });
}

async function deleteExistingUser(userId) {
  const deletedUser = await deleteUser(userId);
  if (!deletedUser) {
    const error = new Error(`User ${userId} not found`);
    error.statusCode = 404;
    throw error;
  }

  return deletedUser;
}

async function validateRegisterUser(message) {
  if (!message.userId) {
    const error = new Error('userId is required');
    error.code = 'MISSING_USER_ID';
    throw error;
  }

  const dbUser = await getUserById(message.userId);
  if (!dbUser) {
    const error = new Error(`User ${message.userId} not found`);
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  if (message.password && dbUser.password !== message.password) {
    const error = new Error('Invalid password');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (dbUser.status !== 'active' || !dbUser.isActive) {
    const error = new Error(`User ${message.userId} is inactive`);
    error.code = 'USER_INACTIVE';
    throw error;
  }

  return dbUser;
}

module.exports = {
  closeDatabase,
  createNewUser,
  deleteExistingUser,
  getAllUsers,
  getTenantUsers,
  loginUserByCredentials,
  markUserOffline,
  updateExistingUser,
  validateRegisterUser,
  waitForDatabase,
};
