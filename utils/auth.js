const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');
const { ApolloError } = require('../graphql/errors');
const { errorCodes } = require('./errorUtils');

const MAX_REFRESH_TOKENS = 15;
const tokenExpiration = '2h';
const refreshTokenExpiration = '7d';

const verifyPasswordRules = password => {
  if (password.length < 6) {
    throw new ApolloError('Password should contain at least 6 characters', errorCodes.PASSWORD_RULES_DO_NOT_MATCH);
  }
};

const hashPassword = password => bcrypt.hashSync(password);
const verifyPassword = (password, hash) => bcrypt.compareSync(password, hash);

const createToken = userInfo =>
  JWT.sign(
    {
      id: userInfo.id,
      role: userInfo.role,
      slug: userInfo.slug,
      tokenStamp: userInfo.tokenStamp,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: tokenExpiration,
    }
  );
const verifyToken = token => JWT.verify(token, process.env.JWT_SECRET);

const generateRefreshToken = userInfo =>
  JWT.sign(
    {
      id: userInfo.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: refreshTokenExpiration,
    }
  );

const createUser = async (credentials, userDataSource, role) => {
  const { name, password, rePassword } = credentials;
  const email = credentials.email.trim().toLowerCase();
  if (password !== rePassword) {
    throw new ApolloError(`Passwords don't match`, errorCodes.PASSWORD_DO_NOT_MATCH);
  }

  verifyPasswordRules(password);
  const hash = hashPassword(password);

  const data = {
    hash,
    tokenStamp: Date.now(),
    role,
    name,
    email
  };

  const result = await userDataSource.create({
    ...data,
  });

  return result;
};

const manageRefreshTokens = ({ newRefreshToken, currentRefreshToken, refreshTokens }) => {
  if (currentRefreshToken) {
    refreshTokens = refreshTokens.filter(t => t.token !== currentRefreshToken.token);
  }

  if (refreshTokens.length >= MAX_REFRESH_TOKENS) {
    refreshTokens.sort((t1, t2) => {
      return new Date(t1.createdAt).getTime() - new Date(t2.createdAt).getTime();
    });
    refreshTokens.splice(0, 1);
  }

  refreshTokens.push({ token: newRefreshToken, createdAt: new Date() });
  return refreshTokens;
};

const signInUser = async (data, userDataSource) => {
  const { email, password } = data;


  let user = await userDataSource.getByEmail(email);
  if (!user) {
    throw new ApolloError(`User not found`, errorCodes.NOT_FOUND);
  }

  const isPasswordValid = verifyPassword(password, user.hash);
  if (!isPasswordValid) {
    throw new ApolloError(`Incorrect ${email ? 'email' : 'username'} or password`, errorCodes.INVALID_CREDENTIALS);
  }

  const refreshToken = generateRefreshToken(user);
  const refreshTokens = manageRefreshTokens({ newRefreshToken: refreshToken, refreshTokens: user.refreshTokens });
  user = await userDataSource.editById(user.id, {
    signInAt: new Date(),
    refreshTokens,
  });

  const token = createToken({
    id: user._id,
    role: user.role,
    slug: user.slug,
    tokenStamp: user.tokenStamp,
  });

  return {
    token,
    refreshToken,
    user,
  };
};

const refreshToken = async (token, user, userDataSource) => {
  let userFromToken;
  try {
    userFromToken = verifyToken(token);
  } catch (err) {
    throw new ApolloError('Invalid refresh token. Verification failed.', errorCodes.INVALID_REFRESH_TOKEN);
  }

  if (!!user.id && userFromToken.id !== user.id) {
    throw new ApolloError('Invalid refresh token. Wrong token owner.', errorCodes.INVALID_REFRESH_TOKEN);
  }

  user = await userDataSource.getById(userFromToken.id);

  const currentRefreshToken = user.refreshTokens.find(t => t.token === token);
  if (!currentRefreshToken) {
    throw new ApolloError('Invalid refresh token. Token not found', errorCodes.INVALID_REFRESH_TOKEN);
  }

  const newRefreshToken = generateRefreshToken(user);
  const refreshTokens = manageRefreshTokens({
    currentRefreshToken,
    newRefreshToken,
    refreshTokens: user.refreshTokens,
  });

  user = await userDataSource.editById(user.id, {
    refreshTokens,
  });

  const newToken = createToken(user);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user,
  };
};

module.exports = {
  refreshToken,
  verifyToken,
  createUser,
  signInUser,
};
