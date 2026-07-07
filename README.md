# Advanced Cryptocurrency System

A production-grade cryptocurrency implementation in Python featuring ECDSA digital signatures, UTXO transaction model, proof-of-work mining, and a modern web interface.

## 🚀 Quick Start

### Installation
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run Web Interface
```bash
./start_frontend.sh
```

**Two Dashboards Available:**
- **Blockchain Dashboard:** http://localhost:5000
- **SmartCoin Token:** http://localhost:5000/smartcoin.html

(Use navigation links at the top to switch between them)

### Run CLI Demo
```bash
source venv/bin/activate
python3 show_my_coin.py
```

## ✨ Features

### Core Blockchain
- **Proof-of-Work Mining** - Adjustable difficulty with automatic adjustment
- **Merkle Tree Verification** - Efficient block transaction verification
- **UTXO Model** - Bitcoin-style unspent transaction outputs
- **Chain Validation** - Complete blockchain integrity verification

### Cryptography & Security
- **ECDSA Signatures** - Elliptic Curve Digital Signature Algorithm (SECP256k1)
- **Transaction Signing** - All transactions cryptographically signed
- **Address Generation** - SHA-256 + RIPEMD-160 address derivation

### Web Interface
- **Modern Dashboard** - Real-time blockchain statistics
- **Wallet Manager** - Create and manage wallets
- **Transaction System** - Send coins with custom fees
- **Mining Interface** - One-click block mining
- **Blockchain Explorer** - View all blocks and transactions

### Backend Features
- **REST API** - Full-featured HTTP API with Flask
- **SQLite Database** - Persistent blockchain storage
- **Transaction Mempool** - Priority-based pending transaction pool
- **Auto-refresh** - Live updates every 5 seconds

## 📂 Project Structure

```
crypto/
├── Backend (Core)
│   ├── crypto_utils.py       # ECDSA & Merkle trees
│   ├── transaction.py        # UTXO transaction model
│   ├── block.py              # Block with Merkle root
│   ├── mempool.py            # Transaction pool
│   ├── advanced_blockchain.py # Main blockchain
│   ├── advanced_wallet.py    # Wallet with ECDSA
│   └── database.py           # SQLite persistence
│
├── API
│   └── api.py                # REST API (Flask)
│
├── Frontend
│   ├── index.html            # Main dashboard
│   ├── style.css             # Modern UI
│   ├── app.js                # API integration
│   └── test.html             # Testing interface
│
└── Demos
    ├── show_my_coin.py       # Quick visualization
    ├── advanced_demo.py      # Full demonstration
    ├── view_coin.py          # Status checker
    └── explorer.py           # Blockchain explorer
```

## 🔌 API Endpoints

- `GET /api/blockchain/info` - Blockchain statistics
- `GET /api/blocks?limit=10` - Recent blocks
- `GET /api/block/<index>` - Get block by index
- `POST /api/wallet/create` - Create new wallet
- `GET /api/balance/<address>` - Check balance
- `POST /api/transaction/create` - Create transaction
- `POST /api/mine` - Mine new block
- `GET /api/mempool` - View pending transactions
- `GET /api/stats` - Economic statistics

## 💻 Usage Examples

### Create Wallet & Send Transaction
```python
from advanced_blockchain import AdvancedBlockchain
from advanced_wallet import AdvancedWallet

# Initialize
blockchain = AdvancedBlockchain(difficulty=2, block_reward=50.0)
wallet1 = AdvancedWallet()
wallet2 = AdvancedWallet()

# Mine block
blockchain.mine_block(wallet1.get_address(), force=True)

# Send transaction
tx = wallet1.create_transaction(wallet2.get_address(), 20, 0.5, blockchain)
blockchain.add_transaction(tx)

# Mine block with transaction
blockchain.mine_block(wallet2.get_address())
```

### Using REST API
```bash
# Create wallet
curl -X POST http://localhost:5000/api/wallet/create

# Mine block
curl -X POST http://localhost:5000/api/mine \
  -H "Content-Type: application/json" \
  -d '{"miner_address": "your_address"}'

# Check balance
curl http://localhost:5000/api/balance/your_address
```

## 🎓 Technical Details

### ECDSA Digital Signatures
Uses secp256k1 curve (same as Bitcoin) for transaction signing and verification.

### UTXO Transaction Model
Each transaction consumes previous outputs and creates new ones, preventing double-spending.

### Merkle Trees
Each block contains a Merkle root of all transactions for efficient verification.

### Proof-of-Work
Mining difficulty automatically adjusts every 10 blocks to maintain target block time.

## 🛠️ Technologies

- **Python 3.7+**
- **ECDSA** - Elliptic curve cryptography
- **Flask** - REST API framework
- **SQLite** - Database persistence
- **Vanilla JS** - Frontend (no frameworks)

## 📝 License

MIT License - Educational purposes

## 🎯 Demo Commands

```bash
# Full CLI demo
python3 advanced_demo.py

# Quick visualization
python3 show_my_coin.py

# Check coin status
python3 view_coin.py

# Start web interface
./start_frontend.sh
```

Open http://localhost:5000 for the web dashboard!
