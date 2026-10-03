const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Home page - customer login
router.get('/', (req, res) => {
  res.render('index');
});

// Handle customer login
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
      return res.render('index', { error: 'Please enter a valid username' });
    }
    
    // Check if user exists
    let user = await User.findOne({ username });
    
    // If user doesn't exist, create a new customer
    if (!user) {
      user = new User({ username, role: 'customer' });
      await user.save();
    } else if (user.role === 'admin') {
      // If admin is trying to login from customer page, redirect to admin
      return res.redirect('/admin');
    }
    
    // Redirect to chat room
    res.redirect(`/chat/${user._id}`);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('index', { error: 'Internal Server Error' });
  }
});

// Customer chat page
const mongoose = require('mongoose');

router.get('/chat/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        let customer;

        if (mongoose.Types.ObjectId.isValid(identifier)) {
            customer = await User.findById(identifier);
        } else {
            const username = identifier
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');

            customer = await User.findOne({ username });

            if (!customer) {
                customer = await User.create({
                    username,
                    role: 'customer'
                });
            }
        }

        if (customer.role === 'admin') {
            return res.redirect('/admin');
        }

        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            return res.status(404).render('error', {
                message: 'Admin not found.'
            });
        }

        const roomId = `${customer._id}-${admin._id}`;

        res.render('chat', {
            customer,
            admin,
            roomId,
            isAdmin: false
        });

    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            message: 'Internal Server Error'
        });
    }
});

module.exports = router;