const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
    phone: { type: String, unique: true },
    email: { type: String, unique: true },
    password: { type: String },
    verified: { type: Boolean, default: false }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
module.exports = mongoose.model('User', userSchema);