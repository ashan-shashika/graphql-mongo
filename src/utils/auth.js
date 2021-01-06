import jwt from 'jsonwebtoken';

const createTokens = (user) => {
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '14d',
    },
  );
  const accessToken = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1d',
  });

  return { refreshToken, accessToken };
};

export default createTokens;
