const Order = require('../models/orderModel');
const UserDetails = require('../models/UserDetails');
const User = require("../models/userModel"); 

exports.createUserDetails = async (req, res) => {
  try {
    const { 
      orderId,
      deliveryId,
      customerName,
      phoneNumber,
      address,
      city,
      zipCode,
      paymentMethod,
      cardDetails,
      paymentId, // Add paymentId to capture PayPal transaction ID
      items,
      totalAmount,
      restaurantId,
      restaurantName
    } = req.body;

    // Basic validation
    if (!orderId || !customerName || !phoneNumber || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Determine payment method label based on what was sent
    let paymentMethodLabel;
    if (paymentMethod === 'paypal') {
      paymentMethodLabel = 'PayPal';
    } else if (paymentMethod === 'cod') {
      paymentMethodLabel = 'Cash';
    } else {
      paymentMethodLabel = paymentMethod || 'Cash';
    }

    const userDetails = await UserDetails.create({
      userId: req.user.userId,
      orderId,
      deliveryId: deliveryId || '',
      customerName,
      phoneNumber,
      address,
      city: city || 'Not specified',
      zipCode: zipCode || 'Not specified',
      paymentMethod: paymentMethodLabel,
      paymentId: paymentId || undefined, // Store PayPal transaction ID if available
      cardDetails: paymentMethod === 'paypal' ? {
        cardNumber: "via PayPal", // Placeholder since we don't get real card details
        expiryDate: "via PayPal",
        cvv: "via PayPal"
      } : cardDetails || null,
      items: items || [],
      totalAmount: totalAmount || 0,
      restaurantId: restaurantId || '',
      restaurantName: restaurantName || 'Unknown Restaurant',
      // Set default values for other fields
      restaurantAdmin: 'Pending',
      deliver: 'Pending',
      customerOrderRecive: 'Pending',
      statusHistory: []
    });

    res.status(201).json({
      message: "User details created successfully",
      userDetails
    });
  } catch (error) {
    console.error('Error creating user details:', error);
    res.status(500).json({ 
      message: 'Error creating user details',
      error: error.message,
      stack: error.stack
    });
  }
};


// userDetailsController.js
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusType, value } = req.body;

    const allowedTypes = ['RestaurantOwner', 'RestaurantOwner', 'customerOrderRecive'];
    if (!allowedTypes.includes(statusType)) {
      return res.status(400).json({ message: 'Invalid status type' });
    }

    const userRole = req.user.role.toLowerCase();
    const rolePermissions = {
      restaurantowner: 'RestaurantOwner',
      deliver: 'RestaurantOwner',
      customer: 'customerOrderRecive'
    };

    const allowedStatusType = rolePermissions[userRole];

    const order = await UserDetails.findOne({ orderId: id });
    if (!order) {
      return res.status(404).json({ message: 'UserDetails not found' });
    }

    // Update status field
    order[statusType] = value;

    // Push into statusHistory
    order.statusHistory.push({
      statusType,
      value,
      updatedAt: new Date()
    });

    // Save changes
    await order.save();

    res.status(200).json({
      message: `${statusType} status updated to ${value}`,
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};


// get user details using user ID 
exports.getUserDetailsByUserId = async (req, res) => {
  try {
  
      const tokenUserId = req.user.userId;

      
      const requestedUserId = req.params.id;

      
      if (tokenUserId !== requestedUserId) {
          return res.status(403).json({
              success: false,
              message: "Access denied: You can only view your own details"
          });
      }

      const user = await User.findById(tokenUserId).select('name email');
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      const userDetails = await UserDetails.find({ userId: tokenUserId })
          .populate('orderId')  
          .select('-__v')       
          .sort({ createdAt: -1 }); 

      if (!userDetails || userDetails.length === 0) {
          return res.status(404).json({ 
              message: "No order details found for this user"
          });
      }

      // Respond with only the logged-in user's details
      res.status(200).json({
          success: true,
          user: {
              name: user.name,
              email: user.email
          },
          orderDetails: userDetails.map(detail => ({
              orderId: detail.orderId,
              customerName: detail.customerName,
              phoneNumber: detail.phoneNumber,
              address: detail.address,
              city: detail.city,
              zipCode: detail.zipCode,
              paymentMethod: detail.paymentMethod,
              items: detail.items,
              totalAmount: detail.totalAmount,
              status: {
                  restaurantAdmin: detail.RestaurantOwner,
                  deliver: detail.deliver,
                  customerOrderRecive: detail.customerOrderRecive
              },
              statusHistory: detail.statusHistory
          }))
      });
  } catch (error) {
      res.status(500).json({ 
          success: false, 
          message: "Error fetching user details", 
          error: error.message 
      });
  }
};

// Get all order details with status: "Pending"
exports.getPendingOrderDetails = async (req, res) => {
  try {
    const pendingOrders = await UserDetails.find({
      $and: [
        { status: "Pending" },
        { RestaurantOwner: "Pending" },
        { deliver: "Pending" },
        { customerOrderRecive: "Pending" }
      ]
    })
      .populate("orderId")
      .select("-__v")
      .sort({ createdAt: -1 });

    if (!pendingOrders || pendingOrders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }

    // Group orders by restaurantId
    const groupedByRestaurant = pendingOrders.reduce((acc, order) => {
      const restaurantId = order.restaurantId;
      if (restaurantId) { 
        if (!acc[restaurantId]) acc[restaurantId] = [];
        acc[restaurantId].push(order);
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      groupedByRestaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending orders",
      error: error.message
    });
  }
};

// Get all orders in UserDetails
exports.getAllOrders = async (req, res) => {
  try {
    const allOrders = await UserDetails.find()
      .populate("orderId")
      .select("-__v")
      .sort({ createdAt: -1 });

    if (!allOrders || allOrders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    const groupedByRestaurant = allOrders.reduce((acc, order) => {
      const restaurantId = order.restaurantId;
      if (restaurantId) { 
        if (!acc[restaurantId]) acc[restaurantId] = [];
        acc[restaurantId].push(order);
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      groupedByRestaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching all orders",
      error: error.message
    });
  }
};

// Get all orders with restaurantAdmin: "Approved"
exports.getApprovedOrders = async (req, res) => {
  try {
    const approvedOrders = await UserDetails.find({ RestaurantOwner: "Approved" })
      .populate("orderId")
      .select("-__v")
      .sort({ createdAt: -1 });

    if (!approvedOrders || approvedOrders.length === 0) {
      return res.status(404).json({ message: "No approved orders found" });
    }

    
    const groupedByRestaurant = approvedOrders.reduce((acc, order) => {
      const restaurantId = order.restaurantId;
      if (restaurantId) {  
        if (!acc[restaurantId]) acc[restaurantId] = [];
        acc[restaurantId].push(order);
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      groupedByRestaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching approved orders",
      error: error.message
    });
  }
};

//  Get all orders with restaurantAdmin: "Approved" and deliver: "Approved"
exports.getAdminAndDeliverApprovedOrders = async (req, res) => {
  try {
    const adminAndDeliverApprovedOrders = await UserDetails.find({
      $and: [
        { RestaurantOwner: "Approved" },
        { deliver: "Approved" }
      ]
    })
      .populate("orderId")
      .select("-__v")
      .sort({ createdAt: -1 });

    if (!adminAndDeliverApprovedOrders || adminAndDeliverApprovedOrders.length === 0) {
      return res.status(404).json({ message: "No orders found with both admin and deliver approved" });
    }
 
    const groupedByRestaurant = adminAndDeliverApprovedOrders.reduce((acc, order) => {
      const restaurantId = order.restaurantId;
      if (restaurantId) {  
        if (!acc[restaurantId]) acc[restaurantId] = [];
        acc[restaurantId].push(order);
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      groupedByRestaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders with both admin and deliver approved",
      error: error.message
    });
  }
};

//  Get all orders with restaurantAdmin , deliver and customerOrderRecive : "Approved" and "Success"
exports.getFullyApprovedOrders = async (req, res) => {
  try {
    const fullyApprovedOrders = await UserDetails.find({
      $and: [
        { RestaurantOwner: "Approved" },
        { deliver: "Approved" },
        { customerOrderRecive: "Success" }
      ]
    })
      .populate("orderId")
      .select("-__v")
      .sort({ createdAt: -1 });

    if (!fullyApprovedOrders || fullyApprovedOrders.length === 0) {
      return res.status(404).json({ message: "No fully approved orders found" });
    }

     
    const groupedByRestaurant = fullyApprovedOrders.reduce((acc, order) => {
      const restaurantId = order.restaurantId;
      if (restaurantId) {  
        if (!acc[restaurantId]) acc[restaurantId] = [];
        acc[restaurantId].push(order);
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      groupedByRestaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching fully approved orders",
      error: error.message
    });
  }
};