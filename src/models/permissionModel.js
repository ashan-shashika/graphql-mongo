import { model, Schema } from 'mongoose';

const PermissionSchema = new Schema({
  name: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
});
PermissionSchema.virtual('id').get(function getId() {
  // eslint-disable-next-line no-underscore-dangle
  return this._id;
});
export default model('Permission', PermissionSchema);
