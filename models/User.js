const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
const { schemaDecorator } = require('../db');
const { emailRegex } = require('../utils/validation');
const {nameMinLength, nameMaxLength, bioMinLength, bioMaxLength} = require("../utils/user");

mongoose.plugin(slug, {
  custom: ['.'],
});

const TokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const schema = {
  slug: {
    type: String,
    slug: 'name',
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    minLength: nameMinLength,
    maxLength: nameMaxLength
  },
  bio: {
    type: String,
    minLength: bioMinLength,
    maxLength: bioMaxLength
  },
  email: {
    type: String,
    index: true,
    match: emailRegex,
    sparse: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  blockedAt: {
    type: Date,
    default: Date.now,
  },
  signInAt: {
    type: Date,
  },
  tokenStamp: {
    type: String,
    required: true,
  },
  refreshTokens: {
    type: [TokenSchema],
  },
};

const [model] = schemaDecorator('User', schema);

module.exports = model;
