// ===== TELEGRAM BOT CONFIG =====
const BOT_TOKEN = '8700711702:AAHwAZ_f2phxCXiOMfj_e0XuAJJ5xaZb43g';
const CHAT_ID = 'https://t.me/narayan_verma';

// ===== ORDER FUNCTIONS =====
function orderPackage(packageName, price) {
    localStorage.setItem('selectedPackage', packageName);
    localStorage.setItem('selectedPrice', price);
    window.location.href = 'order.html';
}

// Load package on order page
window.onload = function() {
    const packageSelect = document.getElementById('packageSelect');
    const displayAmount = document.getElementById('displayAmount');
    
    if (packageSelect) {
        const savedPackage = localStorage.getItem('selectedPackage');
        const savedPrice = localStorage.getItem('selectedPrice');
        
        if (savedPackage && savedPrice) {
            packageSelect.value = savedPackage + ' - ₹' + savedPrice;
            displayAmount.textContent = savedPrice;
        }
        
        packageSelect.addEventListener('change', function() {
            const match = this.value.match(/₹(\d+)/);
            if (match) {
                displayAmount.textContent = match[1];
            }
        });
    }
    
    // Load admin orders
    loadOrders();
};

// ===== SUBMIT ORDER =====
function submitOrder(event) {
    event.preventDefault();
    
    const uid = document.getElementById('ffUid').value;
    const packageVal = document.getElementById('packageSelect').value;
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;
    const txnId = document.getElementById('txnId').value;
    
    if (!uid || !packageVal || !name || !phone || !txnId) {
        alert('Please fill all fields!');
        return;
    }
    
    const amount = packageVal.match(/₹(\d+)/)[1];
    
    const order = {
        id: Date.now(),
        uid: uid,
        package: packageVal,
        name: name,
        phone: phone,
        amount: amount,
        txnId: txnId,
        status: 'pending',
        date: new Date().toLocaleString()
    };
    
    // Save order
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Send to Telegram
    sendTelegramNotification(order);
    
    alert('✅ Order placed successfully! Check Telegram for confirmation.');
    document.getElementById('orderForm').reset();
    document.getElementById('displayAmount').textContent = '0';
}

// ===== TELEGRAM NOTIFICATION =====
function sendTelegramNotification(order) {
    const message = `
🔔 *NEW ORDER RECEIVED!*

👤 *Name:* ${order.name}
📱 *UID:* ${order.uid}
📦 *Package:* ${order.package}
💰 *Amount:* ₹${order.amount}
🔑 *Txn ID:* ${order.txnId}
📞 *Phone:* ${order.phone}
🕐 *Time:* ${order.date}

⚠️ *Action Required:*
Approve or Reject in Admin Panel
    `;
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: '@narayan_verma',
            text: message,
            parse_mode: 'Markdown'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Telegram notification sent:', data);
    })
    .catch(error => {
        console.error('Telegram error:', error);
    });
}

// ===== ADMIN FUNCTIONS =====
function adminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;
    
    if (username === 'NARAYAN1' && password === 'NARAYAN8424948575') {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadOrders();
    } else {
        alert('❌ Invalid credentials!');
    }
}

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const tbody = document.getElementById('ordersBody');
    
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;">No orders yet</td></tr>';
        return;
    }
    
    // Stats
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const approved = orders.filter(o => o.status === 'approved').length;
    const revenue = orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + parseInt(o.amount), 0);
    
    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('approvedOrders').textContent = approved;
    document.getElementById('totalRevenue').textContent = '₹' + revenue;
    
    // Table
    tbody.innerHTML = orders.map((order, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${order.name}</td>
            <td>${order.package}</td>
            <td>₹${order.amount}</td>
            <td>${order.txnId}</td>
            <td class="status-${order.status}">${order.status.toUpperCase()}</td>
            <td>
                ${order.status === 'pending' ? `
                    <button class="btn-approve" onclick="approveOrder(${order.id})">✅ Approve</button>
                    <button class="btn-reject" onclick="rejectOrder(${order.id})">❌ Reject</button>
                ` : `
                    <span style="opacity:0.5;">Done</span>
                `}
            </td>
        </tr>
    `).join('');
}

function approveOrder(id) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === id);
    
    if (order) {
        order.status = 'approved';
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Send confirmation to user
        sendConfirmation(order);
        
        loadOrders();
        alert('✅ Order approved! User notified.');
    }
}

function rejectOrder(id) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === id);
    
    if (order) {
        order.status = 'rejected';
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Send rejection notification
        sendRejection(order);
        
        loadOrders();
        alert('❌ Order rejected!');
    }
}

// ===== SEND CONFIRMATION =====
function sendConfirmation(order) {
    const message = `
✅ *ORDER CONFIRMED!*

🎉 *Payment Verified Successfully!*

👤 *Name:* ${order.name}
📦 *Package:* ${order.package}
💰 *Amount:* ₹${order.amount}

⏰ *Daily likes delivery at 4:00 PM*

📱 *Join Telegram:* @narayan_verma

Thank you for choosing FF LIKE BUY NARAYAN! 🔥
    `;
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: '@narayan_verma',
            text: message,
            parse_mode: 'Markdown'
        })
    })
    .catch(error => console.error('Telegram error:', error));
}

function sendRejection(order) {
    const message = `
❌ *ORDER CANCELLED!*

⚠️ Your order #${order.id} has been rejected.

👤 *Name:* ${order.name}
📦 *Package:* ${order.package}
🔑 *Txn ID:* ${order.txnId}

Reason: Payment verification failed.

📱 *Contact:* @narayan_verma for support.
    `;
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: '@narayan_verma',
            text: message,
            parse_mode: 'Markdown'
        })
    })
    .catch(error => console.error('Telegram error:', error));
}

// ===== AUTO CLEAR OLD ORDERS (7 days) =====
function clearOldOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const filtered = orders.filter(o => {
        const orderDate = parseInt(o.id);
        return orderDate > sevenDaysAgo;
    });
    
    localStorage.setItem('orders', JSON.stringify(filtered));
}

// Run cleanup on load
clearOldOrders();