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

UserSchema.pre('save', async function bcryptPassword(next) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.method('comparePassword', function comparePassword(password) {
  return bcrypt.compare(password, this.password);
});

const User = mongoose.model('User', UserSchema);
export default User;
