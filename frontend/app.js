const API_URL = 'http://localhost:5000/api';
let wallets = [];
let refreshInterval;

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

async function loadBlockchainInfo() {
    try {
        const info = await apiCall('/blockchain/info');

        document.getElementById('totalSupply').textContent = `${info.total_supply || 0} coins`;
        document.getElementById('totalBlocks').textContent = info.length || 0;
        document.getElementById('difficulty').textContent = info.difficulty || 0;
        document.getElementById('chainValid').textContent = info.valid ? '✅' : '❌';

        const statsGrid = document.getElementById('blockchainStats');
        statsGrid.innerHTML = `
            <div class="stat-item">
                <strong>Total Supply</strong>
                <span>${info.total_supply || 0} coins</span>
            </div>
            <div class="stat-item">
                <strong>Block Reward</strong>
                <span>${info.block_reward || 0} coins</span>
            </div>
            <div class="stat-item">
                <strong>Mempool Size</strong>
                <span>${info.mempool_size || 0} transactions</span>
            </div>
            <div class="stat-item">
                <strong>UTXO Count</strong>
                <span>${info.utxo_count || 0}</span>
            </div>
            <div class="stat-item">
                <strong>Unique Addresses</strong>
                <span>${info.unique_addresses || 0}</span>
            </div>
            <div class="stat-item">
                <strong>Avg Block Time</strong>
                <span>${(info.average_block_time || 0).toFixed(2)}s</span>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load blockchain info:', error);
    }
}

async function loadBlocks() {
    try {
        const blocks = await apiCall('/blocks?limit=10');

        const blocksList = document.getElementById('blocksList');
        if (blocks.length === 0) {
            blocksList.innerHTML = '<p class="empty-state">No blocks yet</p>';
            return;
        }

        blocksList.innerHTML = blocks.reverse().map(block => `
            <div class="block-item">
                <div class="block-header">
                    <span class="block-index">Block #${block.index}</span>
                    <span>${new Date(block.timestamp * 1000).toLocaleTimeString()}</span>
                </div>
                <div class="block-hash">Hash: ${block.hash}</div>
                <div class="block-hash">Previous: ${block.previous_hash}</div>
                <div class="block-hash">Merkle Root: ${block.merkle_root}</div>
                <div class="block-info">
                    <div><strong>Nonce:</strong> ${block.nonce}</div>
                    <div><strong>Transactions:</strong> ${block.transactions.length}</div>
                    <div><strong>Size:</strong> ${JSON.stringify(block).length} bytes</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load blocks:', error);
    }
}

async function loadMempool() {
    try {
        const data = await apiCall('/mempool');

        const mempool = document.getElementById('mempool');
        if (data.size === 0) {
            mempool.innerHTML = '<p class="empty-state">No pending transactions</p>';
            return;
        }

        mempool.innerHTML = data.transactions.map(tx => `
            <div class="tx-item">
                <div class="tx-id">TX: ${tx.tx_id}</div>
                <div style="margin-top: 5px;">
                    <strong>Inputs:</strong> ${tx.inputs.length} |
                    <strong>Outputs:</strong> ${tx.outputs.length}
                </div>
                <div style="margin-top: 5px; font-size: 0.85rem; color: #666;">
                    ${new Date(tx.timestamp * 1000).toLocaleString()}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load mempool:', error);
    }
}

async function createWallet() {
    try {
        const wallet = await apiCall('/wallet/create', 'POST');
        wallets.push(wallet);

        updateWalletSelects();
        displayWallets();

        showNotification(`Wallet created! Address: ${wallet.address.substring(0, 20)}...`, 'success');
    } catch (error) {
        showNotification('Failed to create wallet', 'error');
    }
}

function displayWallets() {
    const walletList = document.getElementById('walletList');

    if (wallets.length === 0) {
        walletList.innerHTML = '<p class="empty-state">No wallets yet. Create one!</p>';
        return;
    }

    walletList.innerHTML = wallets.map((wallet, index) => `
        <div class="wallet-item">
            <div><strong>Wallet #${wallet.wallet_id}</strong></div>
            <div class="wallet-address">${wallet.address}</div>
            <div class="wallet-balance">${wallet.balance || 0} coins</div>
        </div>
    `).join('');
}

function updateWalletSelects() {
    const fromWallet = document.getElementById('fromWallet');
    const minerWallet = document.getElementById('minerWallet');

    const options = wallets.map(w =>
        `<option value="${w.wallet_id}">${w.address.substring(0, 30)}... (${w.balance || 0} coins)</option>`
    ).join('');

    fromWallet.innerHTML = '<option value="">Select wallet...</option>' + options;
    minerWallet.innerHTML = '<option value="">Select wallet...</option>' + options;
}

async function checkBalance() {
    const address = document.getElementById('addressInput').value.trim();

    if (!address) {
        showNotification('Please enter an address', 'error');
        return;
    }

    try {
        const data = await apiCall(`/balance/${address}`);

        const result = document.getElementById('balanceResult');
        result.className = 'info-message';
        result.innerHTML = `
            <strong>Balance: ${data.balance} coins</strong><br>
            Address: ${data.address}<br>
            UTXOs: ${data.utxo_count}
        `;
    } catch (error) {
        const result = document.getElementById('balanceResult');
        result.className = 'error-message';
        result.textContent = 'Failed to check balance';
    }
}

async function sendTransaction(event) {
    event.preventDefault();

    const walletId = parseInt(document.getElementById('fromWallet').value);
    const toAddress = document.getElementById('toAddress').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const fee = parseFloat(document.getElementById('fee').value);

    if (!walletId && walletId !== 0) {
        showNotification('Please select a wallet', 'error');
        return;
    }

    try {
        const result = await apiCall('/transaction/create', 'POST', {
            wallet_id: walletId,
            to_address: toAddress,
            amount: amount,
            fee: fee
        });

        const resultDiv = document.getElementById('txResult');
        resultDiv.className = 'success-message';
        resultDiv.innerHTML = `
            <strong>Transaction Created!</strong><br>
            TX ID: ${result.tx_id}<br>
            Status: ${result.message}
        `;

        document.getElementById('transactionForm').reset();
        showNotification('Transaction sent to mempool!', 'success');

        setTimeout(() => {
            loadMempool();
            refreshWallets();
        }, 1000);
    } catch (error) {
        const resultDiv = document.getElementById('txResult');
        resultDiv.className = 'error-message';
        resultDiv.textContent = error.message || 'Failed to send transaction';
    }
}

async function mineBlock() {
    const walletId = parseInt(document.getElementById('minerWallet').value);

    if (!walletId && walletId !== 0) {
        showNotification('Please select a miner wallet', 'error');
        return;
    }

    const wallet = wallets.find(w => w.wallet_id === walletId);
    if (!wallet) {
        showNotification('Wallet not found', 'error');
        return;
    }

    const resultDiv = document.getElementById('miningResult');
    resultDiv.className = 'info-message';
    resultDiv.textContent = '⛏️ Mining... Please wait...';

    try {
        const result = await apiCall('/mine', 'POST', {
            miner_address: wallet.address
        });

        resultDiv.className = 'success-message';
        resultDiv.innerHTML = `
            <strong>Block Mined!</strong><br>
            Block #${result.block.index}<br>
            Hash: ${result.block.hash.substring(0, 40)}...<br>
            Transactions: ${result.block.transactions.length}
        `;

        showNotification('Block mined successfully!', 'success');

        setTimeout(() => {
            loadBlockchainInfo();
            loadBlocks();
            loadMempool();
            refreshWallets();
        }, 1000);
    } catch (error) {
        resultDiv.className = 'error-message';
        resultDiv.textContent = error.message || 'Failed to mine block';
    }
}

async function refreshWallets() {
    for (let wallet of wallets) {
        try {
            const updated = await apiCall(`/wallet/${wallet.wallet_id}`);
            wallet.balance = updated.balance;
        } catch (error) {
            console.error(`Failed to update wallet ${wallet.wallet_id}:`, error);
        }
    }
    displayWallets();
    updateWalletSelects();
}

function startAutoRefresh() {
    loadBlockchainInfo();
    loadBlocks();
    loadMempool();

    refreshInterval = setInterval(() => {
        loadBlockchainInfo();
        loadBlocks();
        loadMempool();
        if (wallets.length > 0) {
            refreshWallets();
        }
    }, 5000);
}

window.addEventListener('load', () => {
    startAutoRefresh();
    displayWallets();
    showNotification('Dashboard loaded successfully!', 'success');
});

window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
