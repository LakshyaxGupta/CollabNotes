const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/notes', authMiddleware, async (req, res) => {
  console.log(req.body);
  try {
    const { title, content, tags, collaboratorEmails, canEdit } = req.body;

    if (!collaboratorEmails || !Array.isArray(collaboratorEmails)) {
      return res.status(400).json({ error: 'Invalid or missing collaboratorEmails' });
    }

    const users = await User.find({ email: { $in: collaboratorEmails } });

    const collaboratorIds = users.map(user => user._id);

    const permissions = users.map(user => ({
      user: user._id,
      canEdit: canEdit
    }));

    const note = new Note({
      title,
      content,
      tags,
      collaborators: collaboratorIds,
      permissions,
      owner: req.userId,
      versionHistory: ['Initial draft']
    });

    await note.save();
    res.status(201).json({ success: true, note });

  } catch (err) {
    console.error('Error saving note:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!note) return res.status(404).json({ error: 'Note not found or unauthorized' });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

function canUserEdit(note, userId) {
  // If the user is the owner
  if (note.owner.equals(userId)) return true;

  // If the user is a collaborator with canEdit = true
  const permission = note.permissions.find(p =>
    p.user.equals(userId) && p.canEdit
  );

  return !!permission; // true if permission exists and canEdit is true
}

router.put('/notes/:id', authMiddleware, async (req, res) => {
  function canUserEdit(note, userId) {
    if (note.owner.equals(userId)) return true;

    const permission = note.permissions.find(p =>
      p.user.equals(userId) && p.canEdit
    );

    return !!permission;
  }

  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (!canUserEdit(note, req.userId)) {
      return res.status(403).json({ error: 'Unauthorized: no edit permission' });
    }

    const { title, content, tags, collaboratorEmails, canEdit } = req.body;

    const users = await User.find({ email: { $in: collaboratorEmails } });

    const collaboratorIds = users.map(user => user._id);
    const permissions = users.map(user => ({
      user: user._id,
      canEdit: canEdit
    }));

    note.title = title;
    note.content = content;
    note.tags = tags;
    note.collaborators = collaboratorIds;
    note.permissions = permissions;
    note.versionHistory.push(content);

    await note.save();

    res.status(200).json({ success: true, note });
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Server error' });
  }
});





module.exports = router;