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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// App Check — proves requests are coming from your real website, not a
// script/bot hitting Firestore directly. Replace the placeholder below with
// your own reCAPTCHA v3 site key from Firebase Console → App Check.
// Until you paste a real key here, this line does nothing harmful — just
// leave it as-is if you haven't set up App Check yet.
if (typeof firebase.appCheck === "function") {
    const appCheck = firebase.appCheck();
    appCheck.activate("6LfxO4EtAAAAAN-1jA3MKguh9CVXfqv1oMQVBrmP", true);
}

const db = firebase.firestore();

// =====================================================
// GLOBAL VARIABLES
// =====================================================
let menuItems = []; 
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentCategory = "All";
let visibleCount = 6;
const MENU_PAGE_SIZE = 6;

const defaultProducts = [
    // ---------- EGG ROLL ----------
    { name: "Single Egg Roll", description: "Griddled paratha rolled with one spiced egg and fresh onion.", price: 60, category: "Egg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Egg Roll", description: "Two eggs, extra spice, wrapped hot in fresh paratha.", price: 70, category: "Egg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Triple Egg Roll", description: "Three eggs stacked in one roll, for the truly hungry.", price: 80, category: "Egg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },

    // ---------- CHICKEN ROLL ----------
    { name: "Chicken Roll", description: "Spiced chicken tikka rolled in hot paratha with onions.", price: 110, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Egg Chicken Roll", description: "Our chicken roll, topped with a fresh egg layer.", price: 120, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Egg Chicken Roll", description: "Chicken roll loaded with a double egg layer.", price: 130, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Chicken Roll", description: "Extra chicken, same great roll, double the bite.", price: 140, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Egg Double Chicken Roll", description: "Double chicken with an egg layer on top.", price: 150, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Egg Double Chicken Roll", description: "Double chicken, double egg — a heavy, filling roll.", price: 160, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Triple Egg Triple Chicken Roll", description: "Triple chicken, triple egg, one very full roll.", price: 200, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Nonveg Jumbo Roll", description: "Our biggest non-veg roll, loaded end to end.", price: 170, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Chicken Kabab Roll", description: "Smoky chicken kabab rolled fresh with onion and chutney.", price: 110, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Egg Chicken Kabab Roll", description: "Chicken kabab roll with a fresh egg layer.", price: 120, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Egg Chicken Kabab Roll", description: "Chicken kabab roll with a double egg layer.", price: 130, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Chicken Kabab Roll", description: "Double the chicken kabab, packed into one roll.", price: 140, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Egg Double Chicken Kabab Roll", description: "Double chicken kabab and double egg together.", price: 160, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Chicken Keema Roll", description: "Minced chicken keema, slow-cooked in masala, rolled hot.", price: 130, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Egg Chicken Keema Roll", description: "Chicken keema roll with a fresh egg layer.", price: 140, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Egg Keema Roll", description: "Keema roll with a double egg layer on top.", price: 150, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Egg Double Keema Roll", description: "Double keema, double egg — rich and filling.", price: 170, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Butter Chicken Roll", description: "Creamy butter chicken rolled in soft paratha.", price: 140, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Butter Chicken Roll", description: "Double portion of our creamy butter chicken filling.", price: 170, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Chilli Chicken Roll", description: "Spicy chilli chicken with peppers and onion, rolled hot.", price: 140, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Chilli Chicken Roll", description: "Extra spicy — double the chilli chicken filling.", price: 170, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Malai Chicken Roll", description: "Mild, creamy malai chicken rolled in fresh paratha.", price: 140, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Single Egg Malai Chicken Roll", description: "Malai chicken roll with a fresh egg layer.", price: 150, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Double Egg Double Chicken Roll (Special)", description: "Our fully loaded special — extra egg, extra chicken.", price: 190, category: "Chicken Roll", available: true, image: "assets/chicken-shawarma.jpg" },

    // ---------- SHAWARMA ----------
    { name: "Chicken Shawarma", description: "Layered chicken shawarma wrapped with sauce and salad.", price: 100, category: "Shawarma", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Chicken Kathi Shawarma", description: "Chicken shawarma, kathi-style, rolled extra hot.", price: 120, category: "Shawarma", available: true, image: "assets/chicken-shawarma.jpg" },
    { name: "Paneer Shawarma", description: "Grilled paneer shawarma with sauce and fresh salad.", price: 100, category: "Shawarma", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Paneer Kathi Shawarma", description: "Paneer shawarma, kathi-style, rolled extra hot.", price: 120, category: "Shawarma", available: true, image: "assets/paneer-veg-roll.jpg" },

    // ---------- PANEER ROLL ----------
    { name: "Paneer Roll", description: "Soft paneer tikka rolled in hot paratha with onions.", price: 100, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Paneer Roll", description: "Extra paneer, same great roll, double the bite.", price: 130, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Paneer Bhurji Roll", description: "Scrambled paneer bhurji, masala-spiced, rolled fresh.", price: 120, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Paneer Bhurji Roll", description: "Double portion of our masala paneer bhurji.", price: 150, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Chilly Paneer Roll", description: "Spicy chilli paneer with peppers and onion, rolled hot.", price: 120, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Chilli Paneer Roll", description: "Extra spicy — double the chilli paneer filling.", price: 150, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Paneer Chaap Mix Roll", description: "A mix of paneer and soya chaap, rolled together.", price: 150, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Butter Paneer Roll", description: "Creamy butter paneer rolled in soft paratha.", price: 130, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Butter Paneer Roll", description: "Double portion of our creamy butter paneer filling.", price: 160, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Soya Chaap Roll", description: "Marinated soya chaap, grilled and rolled fresh.", price: 70, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Soya Chaap Roll", description: "Double portion of our marinated soya chaap.", price: 90, category: "Paneer Roll", available: true, image: "assets/paneer-veg-roll.jpg" },

    // ---------- VEG ROLL ----------
    { name: "Veg Roll", description: "Fresh mixed vegetables, lightly spiced and rolled hot.", price: 50, category: "Veg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Veg Roll", description: "Extra veggies, same great roll, double the bite.", price: 60, category: "Veg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Chowmein Roll", description: "Stir-fried chowmein noodles rolled in hot paratha.", price: 50, category: "Veg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Chowmein Roll", description: "Double portion of our stir-fried chowmein noodles.", price: 60, category: "Veg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Chowmein & Vegmix Roll", description: "Chowmein noodles mixed with fresh vegetables, rolled hot.", price: 60, category: "Veg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Aloo Masala Roll", description: "Spiced masala potato rolled in fresh paratha.", price: 60, category: "Veg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
    { name: "Double Aloo Masala Roll", description: "Double portion of our spiced masala potato.", price: 70, category: "Veg Roll", available: true, image: "assets/paneer-veg-roll.jpg" },
];

// =====================================================
// INITIAL LOAD FROM FIREBASE
// =====================================================
async function loadData() {
    try {
        const snapshot = await db.collection("products").get();
        
        if (snapshot.empty) {
            console.log("Database is empty. Adding default products (batch write)...");

            // Firestore batches max out at 500 writes; chunk just in case the menu grows.
            const chunkSize = 400;
            for (let i = 0; i < defaultProducts.length; i += chunkSize) {
                const batch = db.batch();
                const chunk = defaultProducts.slice(i, i + chunkSize);
                chunk.forEach(product => {
                    const ref = db.collection("products").doc();
                    batch.set(ref, product);
                });
                await batch.commit();
            }

            const newSnapshot = await db.collection("products").get();
            setupMenu(newSnapshot);
        } else {
            setupMenu(snapshot);
        }
    } catch (error) {
        console.error("Error loading products: ", error);
        alert("Failed to load menu. Check your internet connection or Firebase Rules.");
    }
}

function setupMenu(snapshot) {
    menuItems = [];
    snapshot.forEach(doc => {
        menuItems.push({ id: doc.id, ...doc.data() });
    });
    displayMenu("All");
    updateCartCount();
}

// =====================================================
// SHOW MENU
// =====================================================
function displayMenu(category = "All") {
    currentCategory = category;
    visibleCount = MENU_PAGE_SIZE;
    renderMenu();
}

function renderMenu() {
    const container = document.getElementById("menuContainer");
    if (!container) return;

    const filtered = currentCategory === "All" 
        ? menuItems 
        : menuItems.filter(product => product.category === currentCategory);

    container.innerHTML = "";

    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-text">No items in this category yet.</p>`;
        return;
    }

    const itemsToShow = filtered.slice(0, visibleCount);

    itemsToShow.forEach(product => {
        const card = document.createElement("div");
        card.className = "food-card";
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="food-info">
                <span class="food-tag">${product.category || ""}</span>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="food-bottom">
                    <span class="price">₹${product.price}</span>
                    ${product.available 
                        ? `<button class="add-btn" onclick="addToCart('${product.id}')">+ Add</button>`
                        : `<span class="unavailable">Not Available</span>`
                    }
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    if (filtered.length > visibleCount) {
        const remaining = filtered.length - visibleCount;
        const moreBtn = document.createElement("button");
        moreBtn.className = "view-more-btn";
        moreBtn.textContent = `View More (${remaining} more)`;
        moreBtn.onclick = () => {
            visibleCount = filtered.length;
            renderMenu();
        };
        container.appendChild(moreBtn);
    }
}

function filterMenu(category) {
    displayMenu(category);

    document.querySelectorAll(".category-buttons button").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.trim() === category || (category === "All" && btn.textContent.trim() === "All"));
    });
}

// =====================================================
// CART FUNCTIONS
// =====================================================
function addToCart(productId) {
    const product = menuItems.find(item => item.id === productId);
    if (!product || !product.available) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }
    
    saveCart();
    updateCartCount();
    
    // YAHAN SE ALERT HATA DIYA HAI - Ab koi popup nahi aayega!
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById("cartCount").textContent = count;
}

function openCart() {
    displayCart();
    document.getElementById("cartModal").style.display = "flex";
}

function closeCart() {
    document.getElementById("cartModal").style.display = "none";
}

function displayCart() {
    const container = document.getElementById("cartItems");
    const totalElement = document.getElementById("cartTotal");

    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        totalElement.textContent = "₹0";
        return;
    }

    container.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <p>₹${item.price}</p>
            </div>
            <div class="quantity-controls">
                <button onclick="changeQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity('${item.id}', 1)">+</button>
            </div>
            <strong>₹${itemTotal}</strong>
        `;
        container.appendChild(div);
    });
    totalElement.textContent = "₹" + total;
}

function changeQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    const MAX_QTY_PER_ITEM = 20;
    if (item.quantity > MAX_QTY_PER_ITEM) item.quantity = MAX_QTY_PER_ITEM;
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    }
    
    saveCart();
    updateCartCount();
    displayCart();
}

function openCheckout() {
    if (cart.length === 0) return alert("Your cart is empty.");
    closeCart();
    checkoutOpenedAt = Date.now(); // used to detect bot-speed instant submissions
    document.getElementById("checkoutModal").style.display = "flex";
}

function closeCheckout() {
    document.getElementById("checkoutModal").style.display = "none";
}

// =====================================================
// INPUT VALIDATION HELPERS
// =====================================================
function validateCheckoutInputs(name, phone, address) {
    if (!name || name.trim().length === 0) return "Please enter your name.";
    if (name.trim().length > 80) return "Name is too long.";

    // Indian mobile numbers: 10 digits, starting 6-9
    const cleanedPhone = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) return "Please enter a valid 10-digit mobile number.";

    if (!address || address.trim().length < 8) return "Please enter a complete delivery address.";
    if (address.trim().length > 300) return "Address is too long.";

    return null; // no error
}

// =====================================================
// PLACE ORDER (TO FIREBASE)
// =====================================================
let lastOrderSubmitTime = 0;
let checkoutOpenedAt = 0;
const ORDER_SUBMIT_COOLDOWN_MS = 8000; // basic client-side anti-spam; real limiting is App Check + Cloud Function quotas
const MIN_HUMAN_FILL_TIME_MS = 2500; // a real person can't fill+submit the form faster than this

document.getElementById("checkoutForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const errorBox = document.getElementById("checkoutError");

    // Honeypot: if this hidden field got filled, it's almost certainly a bot.
    // Silently pretend success so the bot doesn't learn to skip this field.
    const honeypot = document.getElementById("websiteHP");
    if (honeypot && honeypot.value.trim() !== "") {
        console.warn("Bot submission blocked (honeypot).");
        cart = [];
        saveCart();
        updateCartCount();
        closeCheckout();
        return;
    }

    // A human takes at least a couple seconds to fill this form.
    if (checkoutOpenedAt && (Date.now() - checkoutOpenedAt) < MIN_HUMAN_FILL_TIME_MS) {
        if (errorBox) errorBox.textContent = "Please try again.";
        return;
    }

    if (cart.length === 0) {
        if (errorBox) errorBox.textContent = "Your cart is empty.";
        return;
    }

    // Basic client-side rate limiting: block rapid repeat submissions.
    const now = Date.now();
    if (now - lastOrderSubmitTime < ORDER_SUBMIT_COOLDOWN_MS) {
        if (errorBox) errorBox.textContent = "Please wait a few seconds before placing another order.";
        return;
    }

    const name = document.getElementById("customerName").value;
    const phone = document.getElementById("customerPhone").value.replace(/\D/g, "");
    const address = document.getElementById("customerAddress").value;
    const landmark = document.getElementById("landmark").value.trim().slice(0, 200);
    const payment = document.getElementById("paymentMethod").value;

    const validationError = validateCheckoutInputs(name, phone, address);
    if (validationError) {
        if (errorBox) errorBox.textContent = validationError;
        else alert(validationError);
        return;
    }

    submitBtn.textContent = "Placing Order...";
    submitBtn.disabled = true;
    if (errorBox) errorBox.textContent = "";

    // IMPORTANT: prices are re-looked-up from `menuItems` (freshly loaded
    // from Firestore this session) instead of trusting whatever price sits
    // in the cart/localStorage. This raises the bar against casual price
    // tampering, but it is NOT a full fix — someone editing live JS in
    // DevTools can still override it. The real fix is to route this
    // through the `placeOrder` Cloud Function (functions/index.js), which
    // recomputes price server-side where the browser can't touch it.
    // Once that function is deployed, replace the block below with the
    // callable-function version (see PLACE_ORDER_VIA_CLOUD_FUNCTION below).
    let total = 0;
    const verifiedItems = [];
    for (const cartItem of cart) {
        const liveProduct = menuItems.find(p => p.id === cartItem.id);
        if (!liveProduct || !liveProduct.available) {
            if (errorBox) errorBox.textContent = `${cartItem.name} is no longer available. Please remove it from your cart.`;
            submitBtn.textContent = "Place Order";
            submitBtn.disabled = false;
            return;
        }
        const lineTotal = liveProduct.price * cartItem.quantity;
        total += lineTotal;
        verifiedItems.push({
            id: liveProduct.id,
            name: liveProduct.name,
            price: liveProduct.price,
            quantity: cartItem.quantity
        });
    }

    const orderNumber = "FH" + Math.floor(1000 + Math.random() * 9000);

    const orderData = {
        orderNumber: orderNumber,
        customerName: name.trim(),
        phone: phone,
        address: address.trim(),
        landmark: landmark,
        payment: payment,
        items: verifiedItems,
        total: total,
        status: "Pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        dateString: new Date().toLocaleString()
    };

    try {
        await db.collection("orders").add(orderData);

        lastOrderSubmitTime = Date.now();
        cart = [];
        saveCart();
        updateCartCount();
        closeCheckout();

        document.getElementById("orderNumber").textContent = "Order #" + orderNumber;
        document.getElementById("successModal").style.display = "flex";

    } catch (error) {
        console.error("Error placing order: ", error);
        if (errorBox) errorBox.textContent = "Failed to place order. Please try again.";
        else alert("Failed to place order. Please try again.");
    } finally {
        submitBtn.textContent = "Place Order";
        submitBtn.disabled = false;
        this.reset();
    }
});

// =====================================================
// PLACE_ORDER_VIA_CLOUD_FUNCTION (optional, strongest option)
// =====================================================
// After deploying functions/index.js (requires Firebase Blaze plan):
//   1. Add this script tag in index.html, after the other Firebase SDKs:
//      <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-functions-compat.js"></script>
//   2. Replace the `await db.collection("orders").add(orderData);` line
//      above with:
//
//      const placeOrderFn = firebase.functions().httpsCallable("placeOrder");
//      const result = await placeOrderFn({
//          customerName: name.trim(),
//          phone: phone,
//          address: address.trim(),
//          landmark: landmark,
//          payment: payment,
//          items: cart.map(i => ({ id: i.id, quantity: i.quantity }))
//      });
//      const orderNumber = result.data.orderNumber;
//
// This sends only product IDs + quantities to the server — price is
// looked up and the total is computed entirely server-side, so it can no
// longer be tampered with from the browser at all.

function closeSuccess() {
    document.getElementById("successModal").style.display = "none";
}

// =====================================================
// START APP
// =====================================================
loadData();