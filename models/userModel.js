const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["customer", "user", "restaurantowner", "deliverypersonnel"], 
    default: "customer", 
    set: v => v && typeof v === 'string' ? v.toLowerCase() : v
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
