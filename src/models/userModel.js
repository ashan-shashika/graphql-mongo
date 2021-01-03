/* eslint-disable no-underscore-dangle */
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 42,
  },
});

UserSchema.path('email').validate(async (email) => {
  const users = await mongoose.models.User.countDocuments({ email });
  return !users;
}, 'Email already exists.');

UserSchema.pre('save', async function hashPassword(next) {
  const user = this;
  const hashedPassword = await bcryptPassword(user.password, next);
  user.password = hashedPassword;
  next();
});

UserSchema.pre('updateOne', async function hashPassword(next) {
  const user = this;
  // eslint-disable-next-line no-underscore-dangle
  if (user._update.password) {
    const hashedPassword = await bcryptPassword(user._update.password, next);
    user._update.password = hashedPassword;
  }
  next();
});

UserSchema.method('comparePassword', function comparePassword(password) {
  return bcrypt.compare(password, this.password);
});

const bcryptPassword = async (password, next) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    return next(error);
  }
};

const User = mongoose.model('User', UserSchema);
export default User;
