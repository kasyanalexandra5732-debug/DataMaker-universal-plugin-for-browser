// Состояние приложения
let collectedItems = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Загружаем данные из памяти
    await loadData();
    
    // 2. Инициализируем интерфейс
    const statusDiv = document.getElementById('status');
    if (typeof formatDate === 'function') {
        statusDiv.textContent = `Запуск: ${formatDate(new Date())}`;
    }

    // 3. ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ (ТАБЫ)
    const collectModeBtn = document.getElementById('collectModeBtn');
    const labelModeBtn = document.getElementById('labelModeBtn');
    const collectPanel = document.getElementById('collectPanel');
    const labelPanel = document.getElementById('labelPanel');

    collectModeBtn.addEventListener('click', () => {
        collectModeBtn.classList.add('active');
        labelModeBtn.classList.remove('active');
        collectPanel.classList.remove('hidden');
        labelPanel.classList.add('hidden');
    });

    labelModeBtn.addEventListener('click', () => {
        labelModeBtn.classList.add('active');
        collectModeBtn.classList.remove('active');
        labelPanel.classList.remove('hidden');
        collectPanel.classList.add('hidden');
    });

    // 4. СБОР ВЫДЕЛЕННОГО ТЕКСТА
    document.getElementById('collectBtn').addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString()
        }, (results) => {
            const text = results[0]?.result;
            if (text && text.trim()) {
                addItem({ text: text.trim(), label: null, timestamp: new Date().toISOString() });
            } else {
                alert("Сначала выделите текст на странице!");
            }
        });
    });

    // 5. СБОР ВСЕГО ТЕКСТА
    document.getElementById('collectAllTextBtn').addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.body.innerText.substring(0, 500) + "..."
        }, (results) => {
            if (results[0]?.result) {
                addItem({ text: results[0].result, label: "Весь текст", timestamp: new Date().toISOString() });
            }
        });
    });

    // 6. СБОР ССЫЛОК
    document.getElementById('collectLinksBtn').addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => a.href).join('\n')
        }, (results) => {
            if (results[0]?.result) {
                addItem({ text: results[0].result, label: "Ссылки", timestamp: new Date().toISOString() });
            }
        });
    });

    // 7. ЛОГИКА РАЗМЕТКИ
    document.querySelectorAll('.label-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const label = btn.getAttribute('data-label');
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Отправляем команду в content.js
            chrome.tabs.sendMessage(tab.id, { action: "startLabeling", label: label });
            statusDiv.textContent = `Режим разметки [${label}] активен! Кликните на текст на сайте.`;
            statusDiv.style.color = "orange";
        });
    });

    // 8. КНОПКИ ЭКСПОРТА И ОЧИСТКИ
    document.getElementById('clearAll').addEventListener('click', async () => {
        if (confirm("Очистить все данные?")) {
            collectedItems = [];
            await chrome.storage.local.set({ collectedItems: [] });
            renderItems();
        }
    });

    document.getElementById('exportJSON').addEventListener('click', () => exportData('json'));
    document.getElementById('exportCSV').addEventListener('click', () => exportData('csv'));

    // Слушаем изменения из content.js (когда разметка добавлена)
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.collectedItems) {
            collectedItems = changes.collectedItems.newValue;
            renderItems();
        }
    });
});

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

async function addItem(item) {
    collectedItems.push(item);
    await chrome.storage.local.set({ collectedItems: collectedItems });
    renderItems();
}

async function loadData() {
    const result = await chrome.storage.local.get({ collectedItems: [] });
    collectedItems = result.collectedItems;
    renderItems();
}

function renderItems() {
    const container = document.getElementById('itemsContainer');
    const totalCount = document.getElementById('totalCount');
    const labeledCount = document.getElementById('labeledCount');
    
    container.innerHTML = '';
    collectedItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item';
        div.style.padding = "8px";
        div.style.borderBottom = "1px solid #eee";
        div.innerHTML = `
            <small style="color: #3498db;">${item.label ? `[${item.label}]` : '[Сбор]'}</small>
            <div style="font-size: 13px;">${item.text.substring(0, 150)}</div>
        `;
        container.prepend(div);
    });

    totalCount.textContent = collectedItems.length;
    labeledCount.textContent = collectedItems.filter(i => i.label && i.label !== "Весь текст" && i.label !== "Ссылки").length;
    document.getElementById('itemCount').textContent = `(${collectedItems.length})`;
}

function exportData(format) {
    let content, filename, mimeType;
    if (format === 'json') {
        content = JSON.stringify(collectedItems, null, 2);
        filename = `data_${Date.now()}.json`;
        mimeType = 'application/json';
    } else {
        const rows = collectedItems.map(i => `"${i.label || ''}","${i.text.replace(/"/g, '""')}"`);
        content = "Label,Text\n" + rows.join("\n");
        filename = `data_${Date.now()}.csv`;
        mimeType = 'text/csv';
    }
    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url: url, filename: filename });
}