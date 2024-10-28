const mongoose = require('mongoose');

const addVirtuals = (schema, options) => {
  const _schema = new mongoose.Schema(schema, {
    toObject: {
      virtuals: true,
    },
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: 'version',
    ...options,
  });

  if (!(options?._id === false || schema?._id === false)) {
    // eslint-disable-next-line
    _schema.virtual('id').get(function () {
      return this._id.toString();
    });
  }

  return _schema;
};

module.exports = (model, schema, options) => {
  const _schema = addVirtuals(schema, options);
  return [mongoose.model(model, _schema), _schema];
};

module.exports.subSchema = (schema, options) => {
  return addVirtuals(schema, options);
};
