import mongoose, { Schema } from 'mongoose';

const PostSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});
const Post = mongoose.model('Post', PostSchema);

export default Post;
