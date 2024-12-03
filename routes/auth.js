const express = require('express');
const User = require('../models/User')
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'imgonnabeasuperstar';

//Route 1: Create a user using: POST "/api/auth/createuser". Doesn't require auth
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

        // res.json(user)

        const data =  {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        // console.log(authToken);
        
        res.json({authToken});

    } catch(error) {
        console.error(error.message)
        res.status(500).send("Internal Server Error")
    }

})

//Route 2: Authenticate user: POST "/api/auth/login". require auth but no login required
router.post('/login', [
    body('email', 'Enter a valid email.').isEmail(),
    body('password', 'Password cannot be blank').exists().notEmpty(), // Ensures the field exists and is not empty
    body('password', 'Password must be atleast 6 characters').isLength({min: 6}),
] ,async (req, res) => {
    //If there are errors, return bad request - 400 and the errors
    const error = validationResult(req);
    // console.log(error);
    
    if(!error.isEmpty()) {
        // return res.status(400).json({error: error.array()})
        return res.status(400).json({error: error.array()[0].msg})
    }

    const {email, password} = req.body

    try {
        let user = await User.findOne({email: email})
        if(!user) {
            console.log("User: " + user);
            return res.status(400).json({error: 'Please login with correct credentials', message: error.message})
        }

        const pwdCompare = await bcrypt.compare(password, user.password);
        if(!pwdCompare) {
            console.log("Password: " + pwdCompare);
            return res.status(400).json({error: 'Please login with correct credentials.', message: error.message})
        }

        const data =  {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET, { expiresIn: '1h' }); // Optional: Set expiration
        res.json({authToken});

    } catch(error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error")
    }

});

//Route 3: Get loggedin user details: POST "/api/auth/getuser". login required
router.post('/getuser', fetchuser, async (req, res) => {
    try{
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password')
        res.send(user)
    } catch(error)  {
        console.error(error.message);
        res.status(500).send("Internal Server Error")
    }
});


module.exports = router;