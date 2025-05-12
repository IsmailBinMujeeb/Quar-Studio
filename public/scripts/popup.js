function showModal(type, title, message) {
    const popup = document.getElementById('popup');
    const box = document.getElementById('popupBox');
    const titleEl = document.getElementById('popupTitle');
    const msgEl = document.getElementById('popupMessage');

    box.className = 'popup-box';
    if (type === 'warning') box.classList.add('warning');
    else if (type === 'info') box.classList.add('info');

    titleEl.textContent = title;
    msgEl.textContent = message;

    popup.style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

window.onclick = function (e) {
    const popup = document.getElementById('popup');
    if (e.target === popup) {
        closePopup();
    }
}