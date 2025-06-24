// Connect to the socket server
const socket = io();

// `noteId` must be defined from the backend and injected into this script
socket.emit('join-note', noteId); // 👈 this requires `noteId` to be available!

const editor = document.getElementById('editor');

let timeout;

// Emit changes (with throttling)
editor.addEventListener('input', () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const content = editor.innerHTML;
    socket.emit('send-changes', { noteId, content });
  }, 300);
});

// Listen for incoming updates
socket.on('receive-changes', (content) => {
  // Prevent local override if user is typing
  if (document.activeElement !== editor) {
    editor.innerHTML = content;
  }
});

// this page does not work properly