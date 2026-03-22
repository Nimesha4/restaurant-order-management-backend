// filepath: c:\Users\HP\Desktop\DS_Project\order-service\controllers\authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { validationResult } = require("express-validator");
const { generateToken } = require("../middleware/generateToken");

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { name, email, password, role } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        // Normalize role to capitalize only the first letter
        const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, role: normalizedRole });

        await user.save();
        const token = generateToken(normalizedRole, user._id, email); // Generate token after registration
        res.status(201).json({ message: "Registered successfully", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = generateToken(user.role, user._id, user.email); // Ensure role is passed correctly
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // Check if the logged-in user is a restaurantAdmin
        if (req.user.role.toLowerCase() !== "restaurantadmin") {
            return res.status(403).json({ message: "Access denied: insufficient permissions" });
        }

        // Fetch all users from the database
        const users = await User.find({}, "-password"); // Exclude password field for security
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

 
// ✅ Update user details
exports.updateUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Find the user by ID from the token
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Ensure the user can only update their own data
        if (user._id.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied: You can only update your own data" });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = await bcrypt.hash(password, 10);
        if (role) {
            // Normalize role to match enum values
            const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
            if (!["Customer", "restaurantAdmin", "deliveryPersonnel"].includes(normalizedRole)) {
                return res.status(400).json({ message: "Invalid role value" });
            }
            user.role = normalizedRole;
        }

        await user.save();
        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Delete user account
exports.deleteUser = async (req, res) => {
    try {
        // Find the user by ID from the token
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Ensure the user can only delete their own account
        if (user._id.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Access denied: You can only delete your own account" });
        }

        // Delete the user
        await User.findByIdAndDelete(req.user.userId);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};