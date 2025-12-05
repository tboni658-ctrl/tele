// --- MANAJEMEN DATA (LOCAL STORAGE) ---

const defaultData = {
    positions: [
        {
            id: 1,
            coin: "PLUMEUSDT",
            side: "SHORT",
            leverage: 40,
            size: 1000, 
            entry: 0.0246300,
            mark: 0.0241848,
            tpsl: "0.0223000 / 0.0255000"
        }
    ],
    globals: {
        rate: 16690,
        wallet: 170, // Contoh Saldo Awal
        dailyPercent: 100, // Contoh +100%
        urlBnb: "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=025",
        urlBfusd: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025",
        urlLdusdt: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=025"
    }
};

let positions = [];

function loadData() {
    const saved = localStorage.getItem('futuresProData');
    if (saved) {
        const parsed = JSON.parse(saved);
        positions = parsed.positions;
        
        document.getElementById('in-rate').value = parsed.globals.rate;
        document.getElementById('in-wallet').value = parsed.globals.wallet;
        document.getElementById('in-daily-percent').value = parsed.globals.dailyPercent;
        document.getElementById('in-url-bnb').value = parsed.globals.urlBnb;
        document.getElementById('in-url-bfusd').value = parsed.globals.urlBfusd;
        document.getElementById('in-url-ldusdt').value = parsed.globals.urlLdusdt;
    } else {
        positions = JSON.parse(JSON.stringify(defaultData.positions)); 
        document.getElementById('in-rate').value = defaultData.globals.rate;
        document.getElementById('in-wallet').value = defaultData.globals.wallet;
        document.getElementById('in-daily-percent').value = defaultData.globals.dailyPercent;
        document.getElementById('in-url-bnb').value = defaultData.globals.urlBnb;
        document.getElementById('in-url-bfusd').value = defaultData.globals.urlBfusd;
        document.getElementById('in-url-ldusdt').value = defaultData.globals.urlLdusdt;
    }
}

function saveData() {
    const dataToSave = {
        positions: positions,
        globals: {
            rate: parseFloat(document.getElementById('in-rate').value) || 0,
            wallet: parseFloat(document.getElementById('in-wallet').value) || 0,
            dailyPercent: parseFloat(document.getElementById('in-daily-percent').value) || 0,
            urlBnb: document.getElementById('in-url-bnb').value,
            urlBfusd: document.getElementById('in-url-bfusd').value,
            urlLdusdt: document.getElementById('in-url-ldusdt').value
        }
    };
    localStorage.setItem('futuresProData', JSON.stringify(dataToSave));
}

// --- LOGIKA UTAMA ---

function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
        const negativeSign = amount < 0 ? "-" : "";
        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;
        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) { console.log(e) }
}

function calculateLiquidation(entry, leverage, side) {
    const factor = 0.9 / leverage; 
    if (side === 'LONG') {
        return entry * (1 - factor);
    } else {
        return entry * (1 + factor);
    }
}

function renderAdlLights(roi) {
    let absRoi = Math.abs(roi);
    let level = 0;
    if (absRoi < 1) level = 0;
    else if (absRoi < 20) level = 1;
    else if (absRoi < 50) level = 2;
    else if (absRoi < 100) level = 3;
    else level = 4;

    let activeColorClass = (roi >= 0) ? 'adl-green' : 'adl-red';

    let html = '<div class="adl-container">';
    for (let i = 1; i <= 4; i++) {
        let finalClass = (i <= level) ? activeColorClass : 'adl-off';
        html += `<span class="adl-bar ${finalClass}">!</span>`;
    }
    html += '</div>';
    return html;
}

function renderMainInterface() {
    const container = document.getElementById('positions-container');
    container.innerHTML = ''; 

    positions.forEach((pos, index) => {
        const isShort = pos.side === 'SHORT';
        const sideColor = isShort ? '#f6465d' : '#0ecb81';
        const sideChar = isShort ? 'S' : 'L';
        const margin = pos.size / pos.leverage;

        let pnl = 0;
        if(pos.entry > 0) {
            if(isShort) {
                pnl = pos.size * ((pos.entry - pos.mark) / pos.entry);
            } else {
                pnl = pos.size * ((pos.mark - pos.entry) / pos.entry);
            }
        }
        
        let roi = (margin > 0) ? (pnl / margin) * 100 : 0;
        const liqPrice = calculateLiquidation(pos.entry, pos.leverage, pos.side);
        
        const pnlColor = pnl >= 0 ? '#0ecb81' : '#f6465d';
        const adlHtml = renderAdlLights(roi);

        const html = `
        <div class="position-card">
            <div class="card-header">
                <div class="pair-info">
                    <div class="side-icon-box" style="background-color: ${sideColor}">${sideChar}</div>
                    <span class="pair-name">${pos.coin}</span>
                    <span class="tag-perp">Perp</span>
                    <span class="leverage-badge">Cross ${pos.leverage}x</span>
                    ${adlHtml}
                </div>
                <i class="fas fa-share-alt share-icon"></i>
            </div>

            <div class="pnl-section">
                <div class="pnl-left">
                    <span class="pnl-label">PNL Belum Terealisasi (USDT)</span>
                    <span class="pnl-value-big" style="color: ${pnlColor}">${(pnl>0?'+':'')}${formatMoney(pnl, 2, '.', ',')}</span>
                </div>
                <div class="pnl-right">
                    <span class="pnl-label text-right">ROI</span>
                    <span class="roi-value" style="color: ${pnlColor}">${(roi>0?'+':'')}${formatMoney(roi, 2, '.', ',')}%</span>
                </div>
            </div>

            <div class="data-grid">
                <div class="d-item">
                    <label>Ukuran (USDT)</label>
                    <span>${formatMoney(pos.size, 5, '.', ',')}</span>
                </div>
                <div class="d-item">
                    <label>Margin (USDT)</label>
                    <span>${formatMoney(margin, 2, '.', ',')}</span>
                </div>
                <div class="d-item d-right">
                    <label>Rasio Margin</label>
                    <span class="risk-text" id="risk-${index}">0.00%</span>
                </div>
                <div class="d-item">
                    <label>Harga Entri (USDT)</label>
                    <span>${formatMoney(pos.entry, 7, '.', ',')}</span>
                </div>
                <div class="d-item">
                    <label>Harga Mark (USDT)</label>
                    <span>${formatMoney(pos.mark, 7, '.', ',')}</span>
                </div>
                <div class="d-item d-right">
                    <label>Harga Lik. (USDT)</label>
                    <span>${formatMoney(liqPrice, 7, '.', ',')}</span>
                </div>
            </div>

            <div class="position-actions">
                <button class="action-btn">Adjust Leverage</button>
                <button class="action-btn">Stop Profit & Loss</button>
                <button class="action-btn">Close Position</button>
            </div>
        </div>
        `;
        container.innerHTML += html;
    });

    updateGlobalTotals();
}

function renderEditorInterface() {
    const container = document.getElementById('editor-positions-list');
    container.innerHTML = '';

    positions.forEach((pos, index) => {
        const currentMargin = pos.size / pos.leverage;

        const html = `
        <div class="pos-block">
            <div class="pos-block-header">
                <span style="font-weight:bold; color:white;">Posisi #${index + 1}</span>
                <button class="btn-delete" onclick="deletePosition(${index})">Hapus</button>
            </div>
            <div class="edit-group">
                <label>Nama Koin</label>
                <input type="text" value="${pos.coin}" oninput="updatePos(${index}, 'coin', this.value)">
            </div>
            <div class="edit-group">
                <label>Posisi</label>
                <select onchange="updatePos(${index}, 'side', this.value)">
                    <option value="SHORT" ${pos.side === 'SHORT' ? 'selected' : ''}>Short (Merah)</option>
                    <option value="LONG" ${pos.side === 'LONG' ? 'selected' : ''}>Long (Hijau)</option>
                </select>
            </div>
            <div class="edit-group">
                <label>Leverage (x)</label>
                <input type="number" value="${pos.leverage}" oninput="updatePos(${index}, 'leverage', this.value)">
            </div>
            <div class="edit-group">
                <label>Margin (USDT)</label>
                <input type="number" value="${currentMargin}" oninput="updatePos(${index}, 'margin', this.value)">
            </div>
            <div class="edit-group">
                <label>Harga Entry</label>
                <input type="number" value="${pos.entry}" step="0.0000001" oninput="updatePos(${index}, 'entry', this.value)">
            </div>
            <div class="edit-group">
                <label>Harga Mark</label>
                <input type="number" value="${pos.mark}" step="0.0000001" oninput="updatePos(${index}, 'mark', this.value)">
            </div>
             </div>
        `;
        container.innerHTML += html;
    });
}

function updatePos(index, field, value) {
    const val = parseFloat(value) || 0;

    if(field === 'coin' || field === 'side' || field === 'tpsl') {
        positions[index][field] = value;
    } 
    else if (field === 'margin') {
        positions[index].size = val * positions[index].leverage;
    }
    else if (field === 'leverage') {
        let oldMargin = positions[index].size / positions[index].leverage;
        positions[index].leverage = val;
        positions[index].size = oldMargin * val;
    }
    else {
        positions[index][field] = val;
    }
    
    saveData(); 
    renderMainInterface();
}

function addNewPosition() {
    positions.push({
        id: Date.now(),
        coin: "BTCUSDT",
        side: "LONG",
        leverage: 20,
        size: 2000, 
        entry: 50000,
        mark: 51000,
        tpsl: "-- / --"
    });
    saveData(); 
    renderEditorInterface();
    renderMainInterface();
}

function deletePosition(index) {
    if(confirm("Hapus posisi ini?")) {
        positions.splice(index, 1);
        saveData(); 
        renderEditorInterface();
        renderMainInterface();
    }
}

function updateGlobalTotals() {
    const wallet = parseFloat(document.getElementById('in-wallet').value) || 0;
    const rate = parseFloat(document.getElementById('in-rate').value) || 0;
    const dailyPercent = parseFloat(document.getElementById('in-daily-percent').value) || 0;
    
    const dailyUsdt = wallet * (dailyPercent / 100);
    const currentWalletBalance = wallet + dailyUsdt;

    const sign = (dailyPercent > 0) ? "+" : (dailyPercent < 0 ? "-" : "");
    const percentSign = (dailyPercent > 0) ? "+" : "";
    const absUsdt = Math.abs(dailyUsdt);
    const absPercent = Math.abs(dailyPercent);
    const usdtStr = formatMoney(absUsdt, 2, '.', ',');
    const percentStr = absPercent.toFixed(2); 

    const displayString = `${sign}$${usdtStr}(${sign}${percentStr}%)`;
    const dailyPnlDisp = document.getElementById('disp-daily-pnl');
    dailyPnlDisp.innerText = displayString;
    
    if (dailyPercent < 0) {
        dailyPnlDisp.className = 'text-red';
    } else {
        dailyPnlDisp.className = 'text-green';
    }

    let totalUnrealizedPNL = 0;
    positions.forEach((pos, index) => {
        let pnl = 0;
        if(pos.entry > 0) {
            if(pos.side === 'SHORT') {
                pnl = pos.size * ((pos.entry - pos.mark) / pos.entry);
            } else {
                pnl = pos.size * ((pos.mark - pos.entry) / pos.entry);
            }
        }
        totalUnrealizedPNL += pnl;
        
        const margin = pos.size / pos.leverage;
        const equity = currentWalletBalance + pnl;
        let risk = 0;
        if (equity > 0) {
            risk = (margin / equity) * 10; 
        }
        const riskEl = document.getElementById(`risk-${index}`);
        if(riskEl) riskEl.innerText = formatMoney(risk, 2, '.', ',') + '%';
    });

    const totalMarginBalance = currentWalletBalance + totalUnrealizedPNL;

    document.getElementById('disp-wallet-balance').innerText = formatMoney(currentWalletBalance, 2, '.', ',');
    document.getElementById('disp-wallet-balance-idr').innerText = formatMoney(currentWalletBalance * rate, 2, '.', ',');

    document.getElementById('disp-unrealized-total').innerText = formatMoney(totalUnrealizedPNL, 2, '.', ',');
    document.getElementById('disp-unrealized-idr').innerText = formatMoney(totalUnrealizedPNL * rate, 2, '.', ',');

    document.getElementById('disp-wallet-total').innerText = formatMoney(totalMarginBalance, 2, '.', ',');
    document.getElementById('disp-wallet-idr').innerText = formatMoney(totalMarginBalance * rate, 2, '.', ',');
    
    document.getElementById('icon-bnb').src = document.getElementById('in-url-bnb').value;
    document.getElementById('icon-bfusd').src = document.getElementById('in-url-bfusd').value;
    document.getElementById('icon-ldusdt').src = document.getElementById('in-url-ldusdt').value;
}

function toggleDashboard() {
    const db = document.getElementById('editor-dashboard');
    db.style.display = (db.style.display === 'block') ? 'none' : 'block';
}

document.querySelectorAll('.global-input').forEach(input => {
    input.addEventListener('input', () => {
        saveData(); 
        updateGlobalTotals();
        renderMainInterface(); 
    });
});

// START
loadData(); 
renderMainInterface();
renderEditorInterface();