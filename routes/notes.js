const express = require('express');
const Notes = require('../models/Notes');
const { body, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');

const router = express.Router();

//Route 1: Get all the notes of the user: GET "/api/auth/fetchallnotes". login required
router.get('/fetchallnotes', fetchuser, async (req, res) => {
    try {
        const notes = await Notes.find({user: req.user.id})
        res.json(notes);
    } catch(error) {
        console.error(error.message)
        res.status(500).send("Internal Server Error")
    }
})

//Route 2: Add a new Note: POST "/api/auth/addnote". login required
router.post('/addnotes', fetchuser, [
    body('title', 'Enter a valid title.').isLength({min: 3}),
    body('description', 'Description must be atleast 5 characters').isLength({min: 5}),
], async (req, res) => {
    try {
        //If there are errors, return bad request - 400 and the errors
        const error = validationResult(req);
        if(!error.isEmpty()) {
            return res.status(400).json({error: error.array()})
        }
        const {title, description, tag} = req.body
        const note = new Notes({
            title, description, tag, user: req.user.id
        })

        const savedNote = await note.save();

        res.json(savedNote);
    } catch(error) {
        console.error(error.message)
        res.status(500).send("Internal Server Error")
    }
})

//Route 3: Update a Note: PUT "/api/auth/updatenote". login required
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    try {
        const {title, description, tag} = req.body;
        //Create a new object
        const newNote = {};
        if(title) newNote.title = title
        if(description) newNote.description = description
        if(tag) newNote.tag = tag

        //Find the note to be updated and update it.
        let note = await Notes.findById(req.params.id)
        if(!note) 
            return res.status(404).send('Note not found!')

        if(note.user.toString() != req.user.id)
            return res.status(401).send('Not allowed!')

        note = await Notes.findByIdAndUpdate(req.params.id, {$set: newNote}, {new: true})
        res.json({note})

    } catch(error) {
        console.error(error.message)
        res.status(500).send("Internal Server Error")
    }
})


//Route 4: Delete a Note: DELETE "/api/auth/deletenote". login required
router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    try {
        //find the note to be deleted and delete it.
        let note = await Notes.findById(req.params.id)
        if(!note) 
            return res.status(404).send('Note not found!')

        //Allow deletion only if user owns the note
        if(note.user.toString() != req.user.id)
            return res.status(401).send('Not allowed!')

        note = await Notes.findByIdAndDelete(req.params.id)
        res.json({note})


    } catch(error) {
        console.error(error.message)
        res.status(500).send("Internal Server Error")
    }
})
module.exports = router;