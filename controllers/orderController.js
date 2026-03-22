const Order = require("../models/orderModel");
const User = require("../models/userModel"); // Add this import

// ✅ Create a new order
exports.createOrder = async (req, res) => {
  try {
    // Extract customer details from the authenticated user
    const { userId, email } = req.user; // Destructure user details from the authenticated user
    const { customerName, foodItems, totalPrice, address, paymentMethod, cardDetails } = req.body;

    const newOrder = new Order({
      userId,
      customerName,
      customerEmail: email,  // Ensure this matches the field in your order model
      foodItems,
      totalPrice,
      address,
      paymentMethod,
      cardDetails
    });

    const savedOrder = await newOrder.save();

    // Update user with the last order ID
    await User.findOneAndUpdate(
      { email: email },  // Use email from the destructured user
      { $set: { lastOrderId: savedOrder._id } },  // Update lastOrderId field in the User model
      { new: true }
    );

    res.status(201).json({ message: "Order placed successfully", order: savedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  
      if (!order) return res.status(404).json({ message: "Order not found" });
  
      // Emit real-time order status update
      const io = req.app.get("io");
      io.emit("orderStatusUpdated", { orderId: order._id, status });
  
      res.json({ message: "Order status updated", order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

// ✅ Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
