from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from advanced_blockchain import AdvancedBlockchain
from advanced_wallet import AdvancedWallet
from database import Database
import threading
import os

app = Flask(__name__, static_folder='frontend')
CORS(app)

blockchain = AdvancedBlockchain(difficulty=2, block_reward=50.0)
database = Database("blockchain.db")
wallets = {}


@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('frontend', path)


@app.route('/api/blockchain/info', methods=['GET'])
def get_blockchain_info():
    info = blockchain.get_chain_info()
    mining_stats = blockchain.get_mining_stats()
    return jsonify({
        **info,
        **mining_stats
    })


@app.route('/api/blocks', methods=['GET'])
def get_blocks():
    limit = request.args.get('limit', default=10, type=int)
    blocks = blockchain.chain[-limit:]
    return jsonify([block.to_dict() for block in blocks])


@app.route('/api/block/<int:index>', methods=['GET'])
def get_block_by_index(index):
    block = blockchain.get_block_by_index(index)
    if block:
        return jsonify(block.to_dict())
    return jsonify({'error': 'Block not found'}), 404


@app.route('/api/block/hash/<block_hash>', methods=['GET'])
def get_block_by_hash(block_hash):
    block = blockchain.get_block_by_hash(block_hash)
    if block:
        return jsonify(block.to_dict())
    return jsonify({'error': 'Block not found'}), 404


@app.route('/api/transaction/<tx_id>', methods=['GET'])
def get_transaction(tx_id):
    transaction = blockchain.get_transaction_by_id(tx_id)
    if transaction:
        return jsonify(transaction.to_dict())
    return jsonify({'error': 'Transaction not found'}), 404


@app.route('/api/wallet/create', methods=['POST'])
def create_wallet():
    wallet = AdvancedWallet()
    wallet_id = len(wallets)
    wallets[wallet_id] = wallet
    return jsonify({
        'wallet_id': wallet_id,
        'address': wallet.get_address(),
        'balance': blockchain.get_balance(wallet.get_address())
    })


@app.route('/api/wallet/<int:wallet_id>', methods=['GET'])
def get_wallet(wallet_id):
    if wallet_id not in wallets:
        return jsonify({'error': 'Wallet not found'}), 404

    wallet = wallets[wallet_id]
    return jsonify({
        'wallet_id': wallet_id,
        'address': wallet.get_address(),
        'balance': blockchain.get_balance(wallet.get_address())
    })


@app.route('/api/balance/<address>', methods=['GET'])
def get_balance(address):
    balance = blockchain.get_balance(address)
    utxos = blockchain.get_utxos_for_address(address)
    return jsonify({
        'address': address,
        'balance': balance,
        'utxo_count': len(utxos)
    })


@app.route('/api/transaction/create', methods=['POST'])
def create_transaction():
    data = request.json
    wallet_id = data.get('wallet_id')
    to_address = data.get('to_address')
    amount = data.get('amount')
    fee = data.get('fee', 0.1)

    if wallet_id not in wallets:
        return jsonify({'error': 'Wallet not found'}), 404

    wallet = wallets[wallet_id]
    transaction = wallet.create_transaction(to_address, amount, fee, blockchain)

    if not transaction:
        return jsonify({'error': 'Failed to create transaction'}), 400

    if blockchain.add_transaction(transaction):
        return jsonify({
            'success': True,
            'tx_id': transaction.tx_id,
            'message': 'Transaction added to mempool'
        })

    return jsonify({'error': 'Failed to add transaction to mempool'}), 400


@app.route('/api/mine', methods=['POST'])
def mine_block():
    data = request.json
    miner_address = data.get('miner_address')

    if not miner_address:
        return jsonify({'error': 'Miner address required'}), 400

    block = blockchain.mine_block(miner_address, force=True)

    if block:
        database.save_block(block)

        for tx in block.transactions:
            for i, output in enumerate(tx.outputs):
                utxo_key = f"{tx.tx_id}:{i}"
                database.save_utxo(utxo_key, output.address, output.amount, tx.tx_id, i)

        for tx in block.transactions:
            for tx_input in tx.inputs:
                utxo_key = f"{tx_input.tx_id}:{tx_input.output_index}"
                database.delete_utxo(utxo_key)

        return jsonify({
            'success': True,
            'block': block.to_dict(),
            'message': f'Block {block.index} mined successfully'
        })

    return jsonify({'error': 'No transactions to mine'}), 400


@app.route('/api/mempool', methods=['GET'])
def get_mempool():
    transactions = blockchain.mempool.get_all_transactions()
    return jsonify({
        'size': len(transactions),
        'transactions': [tx.to_dict() for tx in transactions]
    })


@app.route('/api/utxos/<address>', methods=['GET'])
def get_utxos(address):
    utxos = blockchain.get_utxos_for_address(address)
    return jsonify({
        'address': address,
        'utxos': [{'tx_id': tx_id, 'output_index': idx, 'amount': amount}
                  for tx_id, idx, amount in utxos]
    })


@app.route('/api/validate', methods=['GET'])
def validate_chain():
    is_valid = blockchain.is_chain_valid()
    return jsonify({
        'valid': is_valid,
        'message': 'Blockchain is valid' if is_valid else 'Blockchain is invalid'
    })


@app.route('/api/stats', methods=['GET'])
def get_stats():
    total_supply = sum(utxo.amount for utxo in blockchain.utxo_set.values())
    unique_addresses = len(set(utxo.address for utxo in blockchain.utxo_set.values()))

    return jsonify({
        'total_supply': total_supply,
        'unique_addresses': unique_addresses,
        'total_transactions': sum(len(block.transactions) for block in blockchain.chain),
        'blocks_mined': len(blockchain.chain),
        'difficulty': blockchain.difficulty,
        'block_reward': blockchain.block_reward
    })


def run_api(host='0.0.0.0', port=5000, debug=False):
    app.run(host=host, port=port, debug=debug, threaded=True)


if __name__ == '__main__':
    print("Starting Cryptocurrency API Server...")
    print("API running at http://localhost:5000")
    print("\nAvailable endpoints:")
    print("  GET  /api/blockchain/info")
    print("  GET  /api/blocks")
    print("  GET  /api/block/<index>")
    print("  POST /api/wallet/create")
    print("  GET  /api/balance/<address>")
    print("  POST /api/transaction/create")
    print("  POST /api/mine")
    print("  GET  /api/mempool")
    print("  GET  /api/stats")
    run_api(debug=True)
