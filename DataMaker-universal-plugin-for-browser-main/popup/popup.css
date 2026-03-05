// Состояние приложения
let currentMode = 'collect';
let collectedItems = [];

// Загрузка данных при открытии
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    updateStats();
    setupEventListeners();
});


// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение режимов
    document.getElementById('collectModeBtn').addEventListener('click', () => switchMode('collect'));
    document.getElementById('labelModeBtn').addEventListener('click', () => switchMode('label'));
    
    // Кнопки сбора
    document.getElementById('collectBtn').addEventListener('click', collectSelected);
    document.getElementById('collectAllTextBtn').addEventListener('click', collectAllText);
    document.getElementById('collectLinksBtn').addEventListener('click', collectLinks);
    
    // Кнопки разметки
    document.querySelectorAll('.label-btn').forEach(btn => {
        btn.addEventListener('click', (e) => selectLabel(e.target.dataset.label));
    });
    
    // Кастомная метка
    document.getElementById('customLabelInput').addEventListener('input', (e) => {
        if (e.target.value) {
            document.getElementById('applyCustomLabelBtn').classList.remove('hidden');
        }
    });
    
    document.getElementById('applyCustomLabelBtn').addEventListener('click', () => {
        const customLabel = document.getElementById('customLabelInput').value;
        if (customLabel) selectLabel(customLabel);
    });
    
    // Экспорт
    document.getElementById('exportCSV').addEventListener('click', () => exportData('csv'));
    document.getElementById('exportJSON').addEventListener('click', () => exportData('json'));
    document.getElementById('clearAll').addEventListener('click', clearAll);
}

// Переключение режима
function switchMode(mode) {
    currentMode = mode;
    
    // Обновляем кнопки
    document.getElementById('collectModeBtn').classList.toggle('active', mode === 'collect');
    document.getElementById('labelModeBtn').classList.toggle('active', mode === 'label');
    
    // Показываем нужную панель
    document.getElementById('collectPanel').classList.toggle('hidden', mode !== 'collect');
    document.getElementById('labelPanel').classList.toggle('hidden', mode !== 'label');
    
    // Отправляем сообщение в контентный скрипт о смене режима
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            type: 'modeChanged',
            mode: mode
        });
    });
}

// Сбор выделенного текста
async function collectSelected() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    chrome.tabs.sendMessage(tab.id, {type: 'getSelectedText'}, (response) => {
        if (response && response.text) {
            addItem({
                text: response.text,
                url: tab.url,
                timestamp: new Date().toISOString(),
                label: null
            });
        }
    });
}

// Сбор всего текста со страницы
async function collectAllText() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    chrome.tabs.sendMessage(tab.id, {type: 'getAllText'}, (response) => {
        if (response && response.text) {
            addItem({
                text: response.text.substring(0, 500) + '...', // Обрезаем длинный текст
                url: tab.url,
                timestamp: new Date().toISOString(),
                label: null
            });
        }
    });
}

// Сбор всех ссылок
async function collectLinks() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    chrome.tabs.sendMessage(tab.id, {type: 'getLinks'}, (response) => {
        if (response && response.links) {
            response.links.forEach(link => {
                addItem({
                    text: link.text || link.url,
                    url: link.url,
                    timestamp: new Date().toISOString(),
                    label: null,
                    type: 'link'
                });
            });
        }
    });
}

// Выбор метки
function selectLabel(label) {
    // Показываем что режим разметки активен
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            type: 'labelSelected',
            label: label
        });
    });
    
    // Показываем подсказку
    alert(`Режим разметки: кликните на любой элемент страницы, чтобы пометить его как "${label}"`);
}

// Добавление элемента
async function addItem(item) {
    collectedItems.push(item);
    await saveData();
    renderItems();
    updateStats();
}

// Удаление элемента
async function deleteItem(index) {
    collectedItems.splice(index, 1);
    await saveData();
    renderItems();
    updateStats();
}

// Очистка всего
async function clearAll() {
    if (confirm('Удалить все собранные данные?')) {
        collectedItems = [];
        await saveData();
        renderItems();
        updateStats();
    }
}

// Отрисовка элементов
function renderItems() {
    const container = document.getElementById('itemsContainer');
    document.getElementById('itemCount').textContent = `(${collectedItems.length})`;
    
    if (collectedItems.length === 0) {
        container.innerHTML = '<p class="hint">Нет данных. Начните сбор!</p>';
        return;
    }
    
    container.innerHTML = collectedItems.map((item, index) => `
        <div class="data-item ${item.label ? 'labeled' : ''}">
            <div class="text">${escapeHtml(item.text.substring(0, 100))}${item.text.length > 100 ? '...' : ''}</div>
            <div class="meta">
                <span>${new Date(item.timestamp).toLocaleString()}</span>
                ${item.label ? `<span class="label-badge">${item.label}</span>` : ''}
                <span class="delete-btn" data-index="${index}">🗑️</span>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики удаления
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = e.target.dataset.index;
            deleteItem(index);
        });
    });
}

// Обновление статистики
function updateStats() {
    const total = collectedItems.length;
    const labeled = collectedItems.filter(item => item.label).length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('labeledCount').textContent = labeled;
}

// Сохранение в chrome.storage
async function saveData() {
    await chrome.storage.local.set({collectedItems: collectedItems});
}

// Загрузка из chrome.storage
async function loadData() {
    const result = await chrome.storage.local.get('collectedItems');
    collectedItems = result.collectedItems || [];
    renderItems();
}

// Экспорт данных
function exportData(format) {
    let content, filename, mimeType;
    
    if (format === 'json') {
        content = JSON.stringify(collectedItems, null, 2);
        filename = `datamarker_export_${Date.now()}.json`;
        mimeType = 'application/json';
    } else {
        // CSV
        const headers = ['text', 'url', 'timestamp', 'label', 'type'];
        const rows = collectedItems.map(item => [
            `"${item.text.replace(/"/g, '""')}"`,
            `"${item.url}"`,
            item.timestamp,
            item.label || '',
            item.type || 'text'
        ]);
        
        content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        filename = `datamarker_export_${Date.now()}.csv`;
        mimeType = 'text/csv';
    }
    
    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
        url: url,
        filename: filename,
        conflictAction: 'uniquify'
    });
}

// Экранирование HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
