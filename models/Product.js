const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
const {schemaDecorator} = require('../db');
const {descriptionMaxLength, descriptionMinLength, nameMinLength, nameMaxLength} = require("../utils/product");

mongoose.plugin(slug);

const schema = {
  name: {
    type: String,
    required: true,
    index: true,
    minLength: nameMinLength,
    maxLength: nameMaxLength
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    minLength: descriptionMinLength,
    maxLength: descriptionMaxLength
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
};

const [model] = schemaDecorator('Product', schema);
module.exports = model;
