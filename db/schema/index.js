const { users } = require('./users');
const { product } = require('./product');
const { cartItems } = require('./cartItems');
const { orders } = require('./orders');
const { orderItems } = require('./orderItems');
const { invoices } = require('./invoices');
const { promoCodes } = require('./promoCodes');
const { queue } = require('./queue');
const { notifications } = require('./notifications');
const { paymentGatewayTransactions } = require('./paymentGatewayTransactions');

module.exports = {
  users,
  product,
  cartItems,
  orders,
  orderItems,
  invoices,
  promoCodes,
  queue,
  notifications,
  paymentGatewayTransactions,
};
