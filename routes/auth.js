const express = require('express');
const User = require('../models/User')
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

//Create a user using: POST "/api/auth/createuser". Doesn't require auth
router.post('/createuser', [
    body('name', 'Enter a valid name.').isLength({min: 3}),
    body('email', 'Enter a valid email.').isEmail(),
    body('password', 'Password must be atleast 6 characters').isLength({min: 6}),
] ,async (req, res) => {
    //If there are errors, return bad request - 400 and the errors
    const error = validationResult(req);
    if(!error.isEmpty()) {
        return res.status(400).json({error: error.array()})
    }

    //Check whether the user with this email already exists
    try {
        let user = await User.findOne({email: req.body.email})
        if(user) {
            return res.status(400).json({error: 'Sorry! A user with this email id already exists.', message: error.message})
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);
        
        //Create a new user
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass
        })

        // .then(user => res.json(user))
        // .catch(error => {
        //     res.json({
        //         error: 'Please enter a unique validated email.',
        //         message: error.message
        //     })
        // })

        res.json(user)
    } catch(error) {
        console.error(error.message)
        res.status(500).send("Some Error Occured.")
    }

})

module.exports = router;