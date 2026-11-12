// =====================================================================
// ZAIKA KATHI ROLL — CLOUD FUNCTIONS
// =====================================================================
// OPTIONAL but RECOMMENDED: this is the only way to fully close the
// price-tampering hole, because it recomputes the order total from the
// real `products` collection on the server, where the browser can't
// touch it — instead of trusting whatever price the client sends.
//
// Deploy requires the Firebase "Blaze" (pay-as-you-go) plan. It has a
// generous free tier (2M invocations/month), so for a small food-order
// site like this it will very likely cost ₹0/month — but Google requires
// a billing card on file to enable Cloud Functions at all.
//
// Setup:
//   1. firebase init functions   (if not already set up)
//   2. Put this file in functions/index.js
//   3. firebase deploy --only functions
//   4. In script.js, switch placeOrder() to call this function
//      (see the commented alternative in script.js)
// =====================================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const PHONE_REGEX = /^[0-9]{10}$/;
const MAX_ITEMS = 30;

exports.placeOrder = functions.https.onCall(async (data, context) => {
  const { customerName, phone, address, landmark, payment, items } = data;

  // ---- basic shape validation ----
  if (!customerName || typeof customerName !== "string" || customerName.trim().length === 0 || customerName.length > 80) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid customer name.");
  }
  if (!phone || !PHONE_REGEX.test(phone)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid phone number. Must be 10 digits.");
  }
  if (!address || typeof address !== "string" || address.trim().length === 0 || address.length > 300) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid address.");
  }
  if (!["COD", "UPI"].includes(payment)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid payment method.");
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    throw new functions.https.HttpsError("invalid-argument", "Cart is empty or has too many items.");
  }

  // ---- THE ACTUAL FIX: re-fetch each product's real price from Firestore
  // and recompute the total server-side. The client's `price`/`total` is
  // never trusted. ----
  let total = 0;
  const verifiedItems = [];

  for (const item of items) {
    if (!item.id || typeof item.quantity !== "number" || item.quantity <= 0 || item.quantity > 50) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid cart item.");
    }

    const productSnap = await db.collection("products").doc(item.id).get();
    if (!productSnap.exists) {
      throw new functions.https.HttpsError("invalid-argument", `Product ${item.id} no longer exists.`);
    }
    const product = productSnap.data();
    if (!product.available) {
      throw new functions.https.HttpsError("failed-precondition", `${product.name} is currently unavailable.`);
    }

    const lineTotal = product.price * item.quantity;
    total += lineTotal;

    verifiedItems.push({
      id: item.id,
      name: product.name,
      price: product.price, // real price from DB, not from the browser
      quantity: item.quantity
    });
  }

  const orderNumber = "FH" + Math.floor(1000 + Math.random() * 9000);

  const orderData = {
    orderNumber,
    customerName: customerName.trim(),
    phone,
    address: address.trim(),
    landmark: landmark ? String(landmark).trim().slice(0, 200) : "",
    payment,
    items: verifiedItems,
    total, // server-computed, trustworthy
    status: "Pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    dateString: new Date().toLocaleString()
  };

  const docRef = await db.collection("orders").add(orderData);
  return { orderId: docRef.id, orderNumber, total };
});
