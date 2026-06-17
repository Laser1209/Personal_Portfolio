/* ========== 自定义鼠标指针逻辑（全站统一） ========== */
(function () {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;

    const hoverSelectors = [
        'a', 'button',
        '.work-item', '.work-card', '.works-nav-link',
        '.custom-hover',
        '.qr-img', '.qrcode_placeholder',
        '.myself', '.work_placeholder', '.work_info', '.work_item',
        '.project_back_btn', '.art_generate_btn', '.todo_add_btn',
        '.ai-floating-ball', '.ai-chat-btn', '.ai-chat-send',
        '.ai-chat-suggestion', '.ai-clear-confirm button'
    ].join(', ');

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let isHovering = false;

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // 委托事件：动态添加/移除的元素也能响应 hover
    document.addEventListener('mouseover', function (e) {
        if (e.target.matches(hoverSelectors) || e.target.closest(hoverSelectors)) {
            isHovering = true;
            cursor.classList.add('hover');
        }
    });
    document.addEventListener('mouseout', function (e) {
        if (e.target.matches(hoverSelectors) || e.target.closest(hoverSelectors)) {
            isHovering = false;
            cursor.classList.remove('hover');
        }
    });

    function animateCursor() {
        var easing = isHovering ? 0.25 : 0.18;
        cursorX += (mouseX - cursorX) * easing;
        cursorY += (mouseY - cursorY) * easing;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
})();
