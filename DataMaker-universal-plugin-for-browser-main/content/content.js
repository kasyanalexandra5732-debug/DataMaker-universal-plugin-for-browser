// content/content.js

// 1. Проверяем, что скрипт вообще запустился
console.log("🚀 DataMarker: Content Script успешно внедрен на страницу!");

// 2. Создаем визуальный индикатор (плашку) в углу страницы
function createStatusBadge() {
    const badge = document.createElement('div');
    badge.id = 'dm-status-badge';
    badge.textContent = 'DM Active';
    
    // Стилизуем прямо в JS, чтобы не зависеть от content.css (для теста)
    Object.assign(badge.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 12px',
        backgroundColor: '#4CAF50',
        color: 'white',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        zIndex: '9999',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
        opacity: '0.8'
    });

    document.body.appendChild(badge);
}

// Запускаем создание плашки, когда DOM готов
if (document.readyState === 'complete') {
    createStatusBadge();
} else {
    window.addEventListener('load', createStatusBadge);
}
