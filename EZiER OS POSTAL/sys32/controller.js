// Create the custom visual cursor element
const virtualCursor = document.createElement('img');
virtualCursor.id = 'virtual-cursor';
virtualCursor.src = '../sys64/icons/cursor.png';

Object.assign(virtualCursor.style, {
    position: 'fixed',
    width: '24px',          // Adjust width/height based on your icon's dimensions
    height: '24px',
    pointerEvents: 'none',  // Prevents the cursor element from blocking click targets underneath
    transform: 'translate(0, 0)', // Use 'translate(-50%, -50%)' instead if the pointer hot-spot is centered
    zIndex: '999999',
    display: 'none'
});

document.body.appendChild(virtualCursor);
