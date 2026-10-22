/**
 * In-memory order data and the business rules for listing and cancelling.
 *
 * Orders are generated from a fixed seed, so every candidate sees the same
 * data set, and dates are placed relative to the moment the server starts so
 * the orders always look recent. Cancellations are held in memory and are lost
 * when the server restarts.
 */

// The normal path an order follows. CANCELLED is outside this path because
// an order can only be cancelled from one of the CANCELLABLE_STATUSES.
const FULFILLMENT_PATH = ['RECEIVED', 'PROCESSING', 'SENT_TO_PHARMACY', 'SHIPPED', 'DELIVERED'];

// Once an order has been sent to the pharmacy it is being filled, so it can no
// longer be cancelled from HDNet.
const CANCELLABLE_STATUSES = new Set(['RECEIVED', 'PROCESSING']);

const CANCEL_REASONS = Object.freeze(['CUSTOMER_REQUEST', 'DUPLICATE_ORDER', 'ADDRESS_ISSUE', 'OTHER']);

// This order always looks cancellable in the list, but it moves to
// SENT_TO_PHARMACY the moment anyone tries to cancel it. It gives candidates
// a reliable way to see a cancel being rejected (409), the way it would be if
// the order moved on between the user loading the page and pressing Cancel.
const ALWAYS_CONFLICTS_ORDER_NUMBER = 'HD100310';

const ORDER_COUNT = 312;
const FIRST_ORDER_NUMBER = 100001;
const SHIP_TO_STATES = ['AZ', 'CA', 'CO', 'FL', 'GA', 'IL', 'NY', 'OH', 'PA', 'TX', 'WA'];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Small seeded random number generator (mulberry32). Math.random cannot be
 * seeded, and a fixed seed keeps the generated data identical between runs.
 */
function createSeededRandom(seed) {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Picks where an order should be in its life cycle based on its age. Newer
 * orders are mostly still open, older ones are mostly delivered, and a small
 * share of every age group has been cancelled.
 */
function pickFinalStatus(ageInDays, random) {
  if (random() < 0.06) {
    return 'CANCELLED';
  }
  if (ageInDays < 1) return random() < 0.7 ? 'RECEIVED' : 'PROCESSING';
  if (ageInDays < 3) return FULFILLMENT_PATH[Math.floor(random() * 3)];
  if (ageInDays < 7) return FULFILLMENT_PATH[2 + Math.floor(random() * 2)];
  return random() < 0.85 ? 'DELIVERED' : 'SHIPPED';
}

/**
 * Builds the status history for a generated order: each step on the path to
 * its final status, a few hours apart, never later than the current time.
 */
function buildHistory(orderDate, finalStatus, random, now) {
  const steps = finalStatus === 'CANCELLED'
    ? FULFILLMENT_PATH.slice(0, 1 + Math.floor(random() * 2)).concat('CANCELLED')
    : FULFILLMENT_PATH.slice(0, FULFILLMENT_PATH.indexOf(finalStatus) + 1);

  const history = [];
  let time = orderDate.getTime();
  for (const status of steps) {
    history.push({ status, changedAt: new Date(Math.min(time, now)).toISOString() });
    time += (2 + random() * 20) * HOUR_MS;
  }
  return history;
}

function generateOrders() {
  const random = createSeededRandom(20260925);
  const now = Date.now();
  const orders = [];

  // Order numbers go up with time, so the highest number is the newest order.
  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const ageInDays = ((ORDER_COUNT - 1 - i) / ORDER_COUNT) * 45;
    const orderDate = new Date(now - ageInDays * DAY_MS - random() * HOUR_MS);
    const orderNumber = `HD${FIRST_ORDER_NUMBER + i}`;
    const finalStatus = orderNumber === ALWAYS_CONFLICTS_ORDER_NUMBER
      ? 'PROCESSING'
      : pickFinalStatus(ageInDays, random);
    const statusHistory = buildHistory(orderDate, finalStatus, random, now);

    orders.push({
      orderNumber,
      orderDate: orderDate.toISOString().slice(0, 10),
      status: finalStatus,
      rxCount: 1 + Math.floor(random() * 4),
      shipToState: SHIP_TO_STATES[Math.floor(random() * SHIP_TO_STATES.length)],
      lastUpdated: statusHistory[statusHistory.length - 1].changedAt,
      statusHistory,
    });
  }

  // Newest first, which is the order the list is returned in.
  return orders.reverse();
}

const orders = generateOrders();

/** List results do not include the status history; the detail endpoint does. */
function toSummary(order) {
  const { statusHistory, ...summary } = order;
  return summary;
}

function findOrder(orderNumber) {
  return orders.find((order) => order.orderNumber === orderNumber) || null;
}

function changeStatus(order, status, reason) {
  const changedAt = new Date().toISOString();
  order.status = status;
  order.lastUpdated = changedAt;
  order.statusHistory.push(reason ? { status, changedAt, reason } : { status, changedAt });
}

/**
 * Returns one page of orders, newest first. Pages are numbered from 0 so they
 * line up with Angular Material's paginator.
 */
function listOrders({ page, size }) {
  const start = page * size;
  return {
    items: orders.slice(start, start + size).map(toSummary),
    page,
    size,
    totalItems: orders.length,
  };
}

function getOrderDetail(orderNumber) {
  const order = findOrder(orderNumber);
  return order ? { ...order, statusHistory: [...order.statusHistory] } : null;
}

/**
 * Attempts to cancel an order.
 *
 * Returns one of:
 * - { result: 'NOT_FOUND' }
 * - { result: 'CONFLICT', order }  the order is past the point where it can be cancelled
 * - { result: 'CANCELLED', order }
 */
function cancelOrder(orderNumber, reason) {
  const order = findOrder(orderNumber);
  if (!order) {
    return { result: 'NOT_FOUND' };
  }

  if (order.orderNumber === ALWAYS_CONFLICTS_ORDER_NUMBER && CANCELLABLE_STATUSES.has(order.status)) {
    changeStatus(order, 'SENT_TO_PHARMACY');
  }

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    return { result: 'CONFLICT', order: toSummary(order) };
  }

  changeStatus(order, 'CANCELLED', reason);
  return { result: 'CANCELLED', order: toSummary(order) };
}

module.exports = {
  CANCEL_REASONS,
  ALWAYS_CONFLICTS_ORDER_NUMBER,
  listOrders,
  getOrderDetail,
  cancelOrder,
};
