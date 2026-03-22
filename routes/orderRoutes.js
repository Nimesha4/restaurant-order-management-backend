const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const userDetailsController = require("../controllers/userDetailsController");
const { authMiddleware: authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

 
router.post("/", authenticateToken, authorizeRoles("Customer"), orderController.createOrder);
router.get("/", authenticateToken, authorizeRoles("RESTAURANTADMIN"), orderController.getAllOrders);
router.put("/:id", authenticateToken, authorizeRoles("RESTAURANTADMIN", "DELIVERYPERSONNEL"), orderController.updateOrderStatus);
router.delete("/:id", authenticateToken, authorizeRoles("RESTAURANTADMIN"), orderController.deleteOrder);

//get all pending order details
router.get("/details/pending", authenticateToken, authorizeRoles("RESTAURANTADMIN"), userDetailsController.getPendingOrderDetails);

//get all orders
router.get("/details/all", authenticateToken, authorizeRoles("RESTAURANTADMIN"), userDetailsController.getAllOrders);

//get all approved orders
router.get("/details/approved", authenticateToken, authorizeRoles("RESTAURANTADMIN"), userDetailsController.getApprovedOrders);

//get all orders with both admin and deliver approved
router.get("/details/admin-deliver-approved", authenticateToken, authorizeRoles("RESTAURANTADMIN"), userDetailsController.getAdminAndDeliverApprovedOrders);

// get all fully approved orders
router.get("/details/fully-approved", authenticateToken, authorizeRoles("RESTAURANTADMIN"), userDetailsController.getFullyApprovedOrders);


module.exports = router;