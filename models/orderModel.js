const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  foodItems: [{ name: String, quantity: Number, price: Number }],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "out for delivery", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
