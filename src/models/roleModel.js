import { model, Schema } from 'mongoose';

const RoleSchema = new Schema({
  name: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
    default: false,
  },
  permissions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Permission',
    },
  ],
});
RoleSchema.virtual('id').get(function getId() {
  // eslint-disable-next-line no-underscore-dangle
  return this._id;
});
export default model('Role', RoleSchema);
