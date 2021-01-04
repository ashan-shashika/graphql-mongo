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
PostSchema.virtual('id').get(function getId() {
  // eslint-disable-next-line no-underscore-dangle
  return this._id;
});
const Post = mongoose.model('Post', PostSchema);

export default Post;
