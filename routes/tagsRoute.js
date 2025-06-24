const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/tags', authMiddleware, async (req, res) => {
  const notes = await Note.find({
    $or: [
      { owner: req.userId },
      { collaborators: req.userId }
    ]
  }).lean();

  // Collect all unique tags
  const allTags = [...new Set(notes.flatMap(note => note.tags))];

  res.render('tags', { notes, allTags }); // Create a separate EJS for this
});

module.exports = router;