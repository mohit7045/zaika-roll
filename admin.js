// =====================================================
// FIREBASE SETUP
// =====================================================
const firebaseConfig = {
    apiKey: "AIzaSyDpi0roEK4cAYRqqHJ2y1uT0fjdk4u_LM0",
    authDomain: "foodhub-restaurant-22790.firebaseapp.com",
    projectId: "foodhub-restaurant-22790",
    storageBucket: "foodhub-restaurant-22790.firebasestorage.app",
    messagingSenderId: "1016193457906",
    appId: "1:1016193457906:web:6e6cbaa0980393e1befa6b",
    measurementId: "G-E27MPW12XR"
};

firebase.initializeApp(firebaseConfig);

// App Check — replace placeholder with your real reCAPTCHA v3 site key
// from Firebase Console → App Check. Harmless no-op until you do.
if (typeof firebase.appCheck === "function") {
    const appCheck = firebase.appCheck();
    appCheck.activate("6LfxO4EtAAAAAN-1jA3MKguh9CVXfqv1oMQVBrmP", true);
}

const db = firebase.firestore();
const auth = firebase.auth(); // Auth Service Initialize Kiya

// =====================================================
// AUTH STATE LISTENER (AUTO LOGIN / PROTECT DASHBOARD)
// =====================================================
auth.onAuthStateChanged(user => {
    // Check karo ki user logged in hai AUR woh admin hi hai
    if (user && user.email === "zaikaroll@admin.com") {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("adminPanel").style.display = "flex";
        updateDate();
        startRealTimeListeners();
    } else {
        // Agar delivery partner admin panel kholne ki koshish kare toh logout kardo
        if (user) auth.signOut();
        document.getElementById("loginScreen").style.display = "flex";
        document.getElementById("adminPanel").style.display = "none";
    }
});

// =====================================================
// ADMIN LOGIN & LOGOUT (FIREBASE AUTH)
// =====================================================
async function adminLogin() {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const error = document.getElementById("loginError");

    if (!email || !password) {
        error.textContent = "Please enter email and password.";
        return;
    }

    try {
        error.textContent = "Logging in...";
        await auth.signInWithEmailAndPassword(email, password);
        error.textContent = "";
    } catch (err) {
        console.error("Auth Error:", err);
        error.textContent = "Invalid email or password.";
    }
}

async function logout() {
    try {
        await auth.signOut();
    } catch (err) {
        console.error("Logout Error:", err);
    }
}

// =====================================================
// GLOBAL VARIABLES
// =====================================================
let globalOrders = [];
let globalProducts = [];
let globalPartners = [];
let selectedAdminCategory = "All";


let soundEnabled = true;
let isFirstLoad = true;
let previousOrderCount = 0;

// Web Audio API se Order Notification Chime create karo (Bina external audio file ke)
function playNewOrderSound() {
    if (!soundEnabled) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5 note
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
        console.log("Audio alert playback blocked or unsupported", e);
    }
}

function toggleSoundAlert() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById("soundToggleBtn");
    if (btn) btn.textContent = soundEnabled ? "🔔 Sound: ON" : "🔕 Sound: OFF";
}
// =====================================================
// SHOW ADMIN PANEL & REAL-TIME LISTENERS
// =====================================================
function showAdminPanel() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("adminPanel").style.display = "flex";
    updateDate();
    startRealTimeListeners();
}

function startRealTimeListeners() {
    db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        const newOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Detect if a new order came in
        if (!isFirstLoad && newOrders.length > previousOrderCount) {
            playNewOrderSound();
        }
        isFirstLoad = false;
        previousOrderCount = newOrders.length;

        globalOrders = newOrders;
        refreshUI();
    });

    db.collection("products").onSnapshot(snapshot => {
        globalProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        refreshUI();
    });

    db.collection("deliveryPartners").onSnapshot(snapshot => {
        globalPartners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadDeliveryPartners();
    });
}

function refreshUI() {
    loadDashboard();
    loadOrders();
    loadHistory();
    loadProducts();
}

function updateDate() {
    const dateElement = document.getElementById("currentDate");
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric"
        });
    }
}

// =====================================================
// SECTION SWITCH
// =====================================================
function showSection(section, clickedButton) {
    const sections = [
        "dashboardSection", 
        "ordersSection", 
        "historySection", 
        "productsSection", 
        "deliveryPartnersSection"
    ];
    
    sections.forEach(sectionId => {
        const el = document.getElementById(sectionId);
        if (el) el.style.display = "none";
    });

    const selectedSection = document.getElementById(section + "Section");
    if (selectedSection) selectedSection.style.display = "block";

    document.querySelectorAll(".sidebar-btn").forEach(btn => btn.classList.remove("active"));
    if (clickedButton) clickedButton.classList.add("active");

    if (section === "deliveryPartners") {
        loadDeliveryPartners();
    }
}

function showSectionByName(section) {
    const button = document.querySelector(`.sidebar-btn[onclick*="'${section}'"]`);
    showSection(section, button);
}

// =====================================================
// DASHBOARD
// =====================================================
function loadDashboard() {
    const totalOrders = globalOrders.length;
    const pendingOrders = globalOrders.filter(o => o.status === "Pending").length;
    const completedOrders = globalOrders.filter(o => o.status === "Delivered").length;
    
    const revenue = globalOrders
        .filter(o => o.status === "Delivered")
        .reduce((total, order) => total + Number(order.total), 0);

    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("pendingOrders").textContent = pendingOrders;
    document.getElementById("completedOrders").textContent = completedOrders;
    document.getElementById("totalRevenue").textContent = "₹" + revenue;
    document.getElementById("sidebarPending").textContent = pendingOrders;

    loadRecentOrders();
    // <-- ITEM SALES REPORT CALCULATION
}

function loadTopSellingItems() {
    const container = document.getElementById("topSellingItemsContainer");
    if (!container) return;

    const itemMap = {};
    const deliveredOrders = globalOrders.filter(o => o.status === "Delivered");

    deliveredOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                if (!itemMap[item.name]) {
                    itemMap[item.name] = { count: 0, revenue: 0 };
                }
                itemMap[item.name].count += Number(item.quantity || 1);
                itemMap[item.name].revenue += Number(item.price * (item.quantity || 1));
            });
        }
    });

    const sortedItems = Object.keys(itemMap)
        .map(name => ({ name, ...itemMap[name] }))
        .sort((a, b) => b.count - a.count);

    if (sortedItems.length === 0) {
        container.innerHTML = `<p class="empty-text">No sales recorded yet.</p>`;
        return;
    }

    container.innerHTML = `
        <div class="history-table-wrapper">
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Food Item</th>
                        <th>Quantity Sold</th>
                        <th>Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedItems.slice(0, 10).map(item => `
                        <tr>
                            <td><strong>${escapeHTML(item.name)}</strong></td>
                            <td><span style="background: #fff1eb; color: #ff4d00; padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 12px;">${item.count} sold</span></td>
                            <td style="color: #27ae60; font-weight: bold;">₹${item.revenue}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}
function loadRecentOrders() {
    const container = document.getElementById("recentOrders");
    if (!container) return;

    const recent = globalOrders.slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = `<p class="empty-text">No orders yet.</p>`;
        return;
    }

    container.innerHTML = recent.map(order => {
        let formattedDateTime = order.dateString || "Recently";
        if (order.createdAt && order.createdAt.seconds) {
            const d = new Date(order.createdAt.seconds * 1000);
            formattedDateTime = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ", " + 
                                d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
        }

        const itemsSummary = order.items 
            ? order.items.map(i => `${escapeHTML(i.name)} × ${i.quantity}`).join(", ")
            : "";

        return `
            <div class="recent-order-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; margin-bottom:10px; border:1px solid #eee; border-radius:8px; background:#fff;">
                <div>
                    <span class="recent-order-id" style="font-weight:bold; color:#ff4d00;">#${order.orderNumber}</span>
                    <strong style="margin-left:8px;">${escapeHTML(order.customerName)}</strong>
                    <span style="color:#888; font-size:12px;">(${formattedDateTime})</span>
                    <p style="font-size:12px; color:#666; margin-top:4px;">${itemsSummary}</p>
                </div>
                
                <div style="display:flex; align-items:center; gap:8px;">
                    <strong style="font-size:15px; color:#222;">₹${order.total}</strong>
                    <span class="order-status ${getStatusClass(order.status)}">${order.status}</span>
                    
                    <button class="view-btn" onclick="printThermalReceipt('${order.id}')" title="Print Receipt" style="padding:6px 10px;">🖨️</button>
                    <button class="view-btn" onclick="viewOrder('${order.id}')">View</button>
                </div>
            </div>
        `;
    }).join("");
}

function createOrderCard(order) {
    const itemsText = order.items.map(item => `${item.name} × ${item.quantity}`).join(", ");
    
    let orderTime = "Recently";
    if (order.createdAt && order.createdAt.seconds) {
        const d = new Date(order.createdAt.seconds * 1000);
        orderTime = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ", " + 
                    d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    return `
        <div class="order-row">
            <div class="order-main">
                <div class="order-number">#${order.orderNumber}</div>
                <div>
                    <h3>${escapeHTML(order.customerName)} <small style="color:#888; font-weight:normal; font-size:12px;">(${orderTime})</small></h3>
                    <p>${itemsText}</p>
                </div>
            </div>
            <div class="order-price">₹${order.total}</div>
            <span class="order-status ${getStatusClass(order.status)}">${order.status}</span>
            <button class="view-btn" onclick="viewOrder('${order.id}')">View</button>
        </div>
    `;
}
// =====================================================
// ORDER MANAGEMENT
// =====================================================
function loadOrders() {
    const activeOrders = globalOrders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");
    const container = document.getElementById("ordersContainer");
    
    if (!container) return;

    if (activeOrders.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>No active orders right now.</h3></div>`;
        return;
    }

    container.innerHTML = activeOrders.map(order => {
        const partnerOptions = globalPartners.map(p => `
            <option value="${escapeHTML(p.name)}" ${order.assignedPartner === p.name ? "selected" : ""}>
                ${escapeHTML(p.name)}
            </option>
        `).join("");

        const orderTime = order.createdAt && order.createdAt.seconds 
            ? new Date(order.createdAt.seconds * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) 
            : (order.dateString || "Recently");

        return `
        <div class="detailed-order" style="background:#fff; padding:18px; margin-bottom:15px; border-radius:10px; border:1px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
            
            <!-- HEADER -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
                <div>
                    <span style="font-weight:bold; color:#ff4d00; font-size:16px;">#${order.orderNumber}</span> 
                    <h3 style="display:inline; margin-left:8px; font-size:16px;">${escapeHTML(order.customerName)}</h3>
                    <p style="color: #888; font-size: 12px; margin-top: 4px;">⏰ ${orderTime}</p>
                </div>
                <div style="text-align:right;">
                    <strong style="font-size:18px; color:#222;">₹${order.total}</strong>
                    <div style="margin-top:4px;"><span class="order-status ${getStatusClass(order.status)}">${order.status || "Pending"}</span></div>
                </div>
            </div>

            <!-- INFO GRID -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:13px; color:#444; margin-bottom:15px; background:#fafafa; padding:10px; border-radius:6px;">
                <p>📞 <strong>Phone:</strong> <a href="tel:${order.phone}" style="color:inherit; text-decoration:none;">${escapeHTML(order.phone)}</a></p>
                <p>📍 <strong>Address:</strong> ${escapeHTML(order.address)}</p>
                <p>🚴 <strong>Partner:</strong> ${escapeHTML(order.assignedPartner || "Not Assigned")}</p>
            </div>

            <!-- ACTION BAR WITH RECEIPT BUTTON -->
            <div style="display:flex; gap:10px; align-items:center; justify-content:flex-end; flex-wrap:wrap; border-top:1px solid #f0f0f0; padding-top:12px;">
                
                <!-- Assign Partner Dropdown -->
                <select onchange="assignOrderPartner('${order.id}', this.value)" style="padding: 7px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; background:#fff;">
                    <option value="">-- Assign Partner --</option>
                    ${partnerOptions}
                </select>

                <!-- Accept Button -->
                ${order.status === "Pending" ? `
                    <button onclick="updateOrderStatus('${order.id}', 'Accepted')" style="background:#27ae60; color:#fff; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;">
                        ✓ Accept
                    </button>
                ` : `
                    <span style="color:#27ae60; font-weight:600; font-size:12px; background:#e8f8f0; padding:6px 10px; border-radius:6px;">✓ Accepted</span>
                `}

                <!-- Dashboard Direct Print Receipt Button -->
                <button onclick="printThermalReceipt('${order.id}')" style="background:#ff4d00; color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;">
                    🖨️ Receipt
                </button>

                <!-- Cancel Button -->
                <button onclick="updateOrderStatus('${order.id}', 'Cancelled')" style="background:#fff; color:#c0392b; border:1px solid #c0392b; padding:7px 12px; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;">
                    Cancel
                </button>
            </div>

        </div>`;
    }).join("");
}

async function assignOrderPartner(orderId, partnerName) {
    try {
        await db.collection("orders").doc(orderId).update({ 
            assignedPartner: partnerName,
            status: "Out for Delivery"
        });
    } catch (error) {
        console.error("Error assigning partner:", error);
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await db.collection("orders").doc(orderId).update({ status: newStatus });
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

// =====================================================
// ORDER HISTORY & DATE FILTERING WITH SEARCH
// =====================================================
let selectedHistoryDate = "";
let searchQuery = "";

function filterOrdersBySearch() {
    const input = document.getElementById("historySearchInput");
    searchQuery = input ? input.value.trim().toLowerCase() : "";
    loadHistory();
}

function filterOrdersByDate() {
    selectedHistoryDate = document.getElementById("historyDateFilter").value;
    loadHistory();
}

function resetDateFilter() {
    const inputDate = document.getElementById("historyDateFilter");
    const inputSearch = document.getElementById("historySearchInput");
    if (inputDate) inputDate.value = "";
    if (inputSearch) inputSearch.value = "";
    selectedHistoryDate = "";
    searchQuery = "";
    loadHistory();
}

function loadHistory() {
    // Delivered aur Cancelled orders fetch karo
    let history = globalOrders.filter(o => 
        o.status && (o.status.toLowerCase() === "delivered" || o.status.toLowerCase() === "cancelled")
    );

    // Search Filter (Phone, Customer Name, Order Number)
    if (searchQuery) {
        history = history.filter(o => 
            (o.customerName && o.customerName.toLowerCase().includes(searchQuery)) ||
            (o.phone && o.phone.toLowerCase().includes(searchQuery)) ||
            (o.orderNumber && o.orderNumber.toLowerCase().includes(searchQuery))
        );
    }

    // Date Filter
    if (selectedHistoryDate) {
        history = history.filter(o => {
            if (o.createdAt && o.createdAt.seconds) {
                const d = new Date(o.createdAt.seconds * 1000);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}` === selectedHistoryDate;
            }
            return false;
        });
    }

    // Filtered Date/Search ki Stats Calculate karo
    const count = history.length;
    const revenue = history
        .filter(o => o.status.toLowerCase() === "delivered")
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const countEl = document.getElementById("filteredOrderCount");
    const revEl = document.getElementById("filteredRevenue");
    if (countEl) countEl.textContent = count;
    if (revEl) revEl.textContent = "₹" + revenue;

    const container = document.getElementById("historyContainer");
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>No matching orders found</h3><p>Try searching with another name, phone number or date.</p></div>`;
        return;
    }

    container.innerHTML = `
        <div class="history-table-wrapper">
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(order => {
                        let formattedDateTime = order.dateString || "Recently";
                        if (order.createdAt && order.createdAt.seconds) {
                            const d = new Date(order.createdAt.seconds * 1000);
                            formattedDateTime = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " + 
                                                d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
                        }

                        return `
                        <tr>
                            <td>#${order.orderNumber}</td>
                            <td>${escapeHTML(order.customerName)}</td>
                            <td>₹${order.total}</td>
                            <td>${order.payment}</td>
                            <td>${formattedDateTime}</td>
                            <td><span class="order-status ${getStatusClass(order.status)}">${order.status}</span></td>
                            <td>
                                <button class="view-btn" onclick="viewOrder('${order.id}')">View</button>
                                <button class="view-btn" onclick="printThermalReceipt('${order.id}')" style="background:#27ae60; color:#fff; border:none; margin:0 4px;">🖨️ Receipt</button>
                                <button class="delete-btn" onclick="deleteHistoryOrder('${order.id}')">Delete</button>
                            </td>
                        </tr>
                    `}).join("")}
                </tbody>
            </table>
        </div>
    `;
}

// =====================================================
// VIEW ORDER MODAL
// =====================================================
function viewOrder(orderId) {
    const order = globalOrders.find(item => item.id === orderId);
    if (!order) return;

    const container = document.getElementById("orderDetails");
    container.innerHTML = `
        <div class="modal-order-header">
            <p>ORDER</p>
            <h2>#${order.orderNumber}</h2>
            <span class="order-status ${getStatusClass(order.status)}">${order.status}</span>
        </div>
        <div class="modal-section">
            <h3>Customer</h3>
            <p><strong>Name:</strong> ${escapeHTML(order.customerName)}</p>
            <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
            <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
            <p><strong>Landmark:</strong> ${order.landmark ? escapeHTML(order.landmark) : "—"}</p>
        </div>
        <div class="modal-section">
            <h3>Order Items</h3>
            ${order.items.map(item => `
                <div class="modal-item">
                    <span>${escapeHTML(item.name)} × ${item.quantity}</span>
                    <strong>₹${item.price * item.quantity}</strong>
                </div>
            `).join("")}
            <div class="modal-total">
                <span>Total</span>
                <strong>₹${order.total}</strong>
            </div>
        </div>
        <div class="modal-section">
            <p><strong>Payment:</strong> ${order.payment}</p>
            <p><strong>Ordered:</strong> ${order.dateString || "Recently"}</p>
        </div>
    `;
    document.getElementById("orderModal").style.display = "flex";
}

function closeOrderModal() {
    document.getElementById("orderModal").style.display = "none";
}

// =====================================================
// MENU MANAGEMENT (WITH CATEGORY FILTER & EDIT MODAL)
// =====================================================
function filterAdminMenu(category, btn) {
    selectedAdminCategory = category;
    
    // Highlight active filter button
    const buttons = btn.parentElement.querySelectorAll("button");
    buttons.forEach(b => {
        b.style.background = "#eee";
        b.style.color = "#333";
    });
    btn.style.background = "#ff4d00";
    btn.style.color = "#fff";

    loadProducts();
}

function loadProducts() {
    const container = document.getElementById("productsContainer");
    if (!container) return;

    const filtered = selectedAdminCategory === "All" 
        ? globalProducts 
        : globalProducts.filter(p => p.category === selectedAdminCategory);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No food items in "${selectedAdminCategory}"</h3>
                <p>Add items or select another category.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = `<div class="product-grid">${filtered.map(p => createProductCard(p)).join("")}</div>`;
}

function createProductCard(product) {
    return `
        <div class="product-admin-card">
            <img src="${product.image}" alt="${escapeHTML(product.name)}">
            <div class="product-admin-info">
                <div class="product-category">${product.category}</div>
                <h3>${escapeHTML(product.name)}</h3>
                <p>${escapeHTML(product.description)}</p>
                <strong class="product-price">₹${product.price}</strong>
                <div class="product-status-row">
                    <button class="availability-btn ${product.available ? "available" : "unavailable"}" 
                            onclick="toggleAvailability('${product.id}')">
                        ${product.available ? "✓ Available" : "× Not Available"}
                    </button>
                    <button class="edit-btn" onclick="openEditProductModal('${product.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteProduct('${product.id}')">Delete</button>
                </div>
            </div>
        </div>
    `;
}

async function toggleAvailability(productId) {
    const product = globalProducts.find(item => item.id === productId);
    if (!product) return;
    try {
        await db.collection("products").doc(productId).update({ available: !product.available });
    } catch (error) {
        console.error("Error toggling availability:", error);
    }
}

async function addProduct() {
    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const category = document.getElementById("productCategory").value;
    const description = document.getElementById("productDescription").value.trim();
    const imageInput = document.getElementById("productImage");
    const file = imageInput.files[0];

    if (!name || !price || !file) {
        return alert("Please enter item name, price and select an image.");
    }

    const btn = document.querySelector(".add-product-card .primary-btn");
    btn.textContent = "Uploading Item...";
    btn.disabled = true;

    const reader = new FileReader();
    reader.onloadend = async function() {
        try {
            await db.collection("products").add({
                name: name,
                price: price,
                category: category,
                image: reader.result,
                description: description,
                available: true
            });
            
            document.getElementById("productName").value = "";
            document.getElementById("productPrice").value = "";
            document.getElementById("productImage").value = "";
            document.getElementById("productDescription").value = "";
        } catch (error) {
            console.error("Error adding product:", error);
        } finally {
            btn.textContent = "+ Add Food Item";
            btn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

// EDIT PRODUCT MODAL LOGIC (NO PROMPTS, INCLUDES IMAGE CHANGE)
function openEditProductModal(productId) {
    const product = globalProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById("editProductId").value = product.id;
    document.getElementById("editProductName").value = product.name;
    document.getElementById("editProductPrice").value = product.price;
    document.getElementById("editProductCategory").value = product.category || "Egg Roll";
    document.getElementById("editProductDescription").value = product.description || "";
    document.getElementById("editProductImage").value = "";

    document.getElementById("editProductModal").style.display = "flex";
}

function closeEditProductModal() {
    document.getElementById("editProductModal").style.display = "none";
}

async function saveProductEdit() {
    const productId = document.getElementById("editProductId").value;
    const name = document.getElementById("editProductName").value.trim();
    const price = Number(document.getElementById("editProductPrice").value);
    const category = document.getElementById("editProductCategory").value;
    const description = document.getElementById("editProductDescription").value.trim();
    const imageInput = document.getElementById("editProductImage");
    const file = imageInput.files[0];

    if (!name || !price) {
        return alert("Name and price cannot be empty.");
    }

    const saveBtn = document.getElementById("saveEditBtn");
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    try {
        const updateData = {
            name: name,
            price: price,
            category: category,
            description: description
        };

        if (file) {
            const reader = new FileReader();
            reader.onloadend = async function() {
                updateData.image = reader.result;
                await db.collection("products").doc(productId).update(updateData);
                closeEditProductModal();
                saveBtn.textContent = "Save Changes";
                saveBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            await db.collection("products").doc(productId).update(updateData);
            closeEditProductModal();
            saveBtn.textContent = "Save Changes";
            saveBtn.disabled = false;
        }
    } catch (error) {
        console.error("Error updating product:", error);
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = false;
    }
}

async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this food item?")) return;
    try {
        await db.collection("products").doc(productId).delete();
    } catch (error) {
        console.error("Error deleting product:", error);
    }
}

// =====================================================
// SECURE DELIVERY PARTNER CREATION (FIREBASE AUTH)
// =====================================================
async function addDeliveryPartner() {
    const name = document.getElementById("partnerName").value.trim();
    const phone = document.getElementById("partnerPhone").value.trim();
    const password = document.getElementById("partnerPassword").value.trim();

    if (!name || !phone || !password) {
        return alert("Please fill all fields!");
    }

    if (password.length < 6) {
        return alert("Password must be at least 6 characters long.");
    }

    const email = `${phone}@zaikaroll.com`;

    try {
        // Admin session kharab kiye bina secondary instance se Auth user banana
        const tempApp = firebase.initializeApp(firebaseConfig, "TempAuthApp");
        const tempAuth = tempApp.auth();

        // 1. Firebase Auth mein official user account create karein
        const userCredential = await tempAuth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // 2. Firestore mein BINA PLAINTEXT PASSWORD ke details store karein
        await db.collection("deliveryPartners").doc(uid).set({
            uid: uid,
            name: name,
            phone: phone,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Temp App cleanup
        await tempApp.delete();

        alert(`✓ Delivery Partner '${name}' successfully created!`);

        document.getElementById("partnerName").value = "";
        document.getElementById("partnerPhone").value = "";
        document.getElementById("partnerPassword").value = "";

    } catch (error) {
        console.error("Error creating partner:", error);
        if (error.code === "auth/email-already-in-use") {
            alert("This phone number is already registered as a partner.");
        } else {
            alert("Failed to create partner: " + error.message);
        }
    }
}
// =====================================================
// UTILS
// =====================================================
function getStatusClass(status) {
    return status.toLowerCase().replace(/ /g, "-");
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}



// =====================================================
// CHANGE PASSWORD LOGIC
// =====================================================
function openChangePasswordModal() {
    document.getElementById("currentAdminPassword").value = "";
    document.getElementById("newAdminPassword").value = "";
    document.getElementById("confirmAdminPassword").value = "";
    document.getElementById("changePasswordError").style.display = "none";
    document.getElementById("changePasswordSuccess").style.display = "none";
    document.getElementById("changePasswordModal").style.display = "flex";
}

function closeChangePasswordModal() {
    document.getElementById("changePasswordModal").style.display = "none";
}

async function submitChangePassword() {
    const currentPassword = document.getElementById("currentAdminPassword").value.trim();
    const newPassword = document.getElementById("newAdminPassword").value.trim();
    const confirmPassword = document.getElementById("confirmAdminPassword").value.trim();
    
    const errorEl = document.getElementById("changePasswordError");
    const successEl = document.getElementById("changePasswordSuccess");
    const saveBtn = document.getElementById("savePasswordBtn");

    errorEl.style.display = "none";
    successEl.style.display = "none";

    if (!currentPassword || !newPassword || !confirmPassword) {
        errorEl.textContent = "Please fill in all fields.";
        errorEl.style.display = "block";
        return;
    }

    if (newPassword.length < 6) {
        errorEl.textContent = "New password must be at least 6 characters long.";
        errorEl.style.display = "block";
        return;
    }

    if (newPassword !== confirmPassword) {
        errorEl.textContent = "New password and confirm password do not match.";
        errorEl.style.display = "block";
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        errorEl.textContent = "Session expired. Please log in again.";
        errorEl.style.display = "block";
        return;
    }

    saveBtn.textContent = "Updating...";
    saveBtn.disabled = true;

    try {
        // Step 1: Current password verify karne ke liye Re-authenticate karo
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);

        // Step 2: Firebase Auth par naya password update karo
        await user.updatePassword(newPassword);

        successEl.textContent = "✓ Password updated successfully!";
        successEl.style.display = "block";

        setTimeout(() => {
            closeChangePasswordModal();
        }, 1500);

    } catch (error) {
        console.error("Password update error:", error);
        if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
            errorEl.textContent = "Current password is incorrect.";
        } else {
            errorEl.textContent = error.message;
        }
        errorEl.style.display = "block";
    } finally {
        saveBtn.textContent = "Update Password";
        saveBtn.disabled = false;
    }
}


// =====================================================
// THERMAL RECEIPT / KOT PRINT
// =====================================================
function printThermalReceipt(orderId) {
    const order = globalOrders.find(o => o.id === orderId);
    if (!order) return;

    const printWindow = window.open("", "_blank", "width=350,height=600");
    const itemsHTML = order.items.map(item => `
        <tr>
            <td style="padding:4px 0;">${escapeHTML(item.name)}</td>
            <td style="padding:4px 0; text-align:center;">x${item.quantity}</td>
            <td style="padding:4px 0; text-align:right;">₹${item.price * item.quantity}</td>
        </tr>
    `).join("");

    printWindow.document.write(`
        <html>
        <head>
            <title>Receipt #${order.orderNumber}</title>
            <style>
                body { font-family: monospace; width: 280px; margin: 0 auto; padding: 10px; font-size: 12px; }
                .center { text-align: center; }
                .line { border-bottom: 1px dashed #000; margin: 8px 0; }
                table { width: 100%; border-collapse: collapse; }
            </style>
        </head>
        <body>
            <div class="center">
                <h2 style="margin:0;">ZAIKA KATHI ROLL</h2>
                <p style="margin:3px 0;">Main Market, Sonipat</p>
                <p style="margin:3px 0;">Ph: +91 98765 43210</p>
            </div>
            <div class="line"></div>
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
            <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
            <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
            <p><strong>Pay Mode:</strong> ${order.payment}</p>
            <div class="line"></div>
            <table>
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th style="text-align:left;">Item</th>
                        <th>Qty</th>
                        <th style="text-align:right;">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            <div class="line"></div>
            <h3 style="text-align:right; margin: 5px 0;">TOTAL: ₹${order.total}</h3>
            <div class="line"></div>
            <p class="center">*** Thank You! Visit Again ***</p>
            <script>
                window.onload = function() { window.print(); window.close(); }
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}


// =====================================================
// ANALYTICS MODAL CONTROLS
// =====================================================
function openAnalyticsModal() {
    loadTopSellingItems();
    document.getElementById("analyticsModal").style.display = "flex";
}

function closeAnalyticsModal() {
    document.getElementById("analyticsModal").style.display = "none";
}

// =====================================================
// START APP
// =====================================================
checkAdminLogin();