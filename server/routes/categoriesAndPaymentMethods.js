const express = require('express');
const CategoriesController = require('../controllers/categoriesController');
const PaymentMethodsController = require('../controllers/paymentMethodsController');

function createCategoriesRoutes(db) {
    const router = express.Router();
    const controller = new CategoriesController(db);

    // GET all categories (Public)
    router.get('/', controller.getAllCategories);

    return router;
}

function createProtectedCategoriesRoutes(db) {
    const router = express.Router();
    const controller = new CategoriesController(db);

    // POST create new category (Protected)
    router.post('/', controller.createCategory);

    // PUT update category (Protected)
    router.put('/:value', controller.updateCategory);

    // DELETE category (Protected)
    router.delete('/:value', controller.deleteCategory);

    return router;
}

function createPaymentMethodsRoutes(db) {
    const router = express.Router();
    const controller = new PaymentMethodsController(db);

    // GET all payment methods (Public)
    router.get('/', controller.getAllPaymentMethods);

    return router;
}

function createProtectedPaymentMethodsRoutes(db) {
    const router = express.Router();
    const controller = new PaymentMethodsController(db);

    // POST create new payment method (Protected)
    router.post('/', controller.createPaymentMethod);

    // PUT update payment method (Protected)
    router.put('/:value', controller.updatePaymentMethod);

    // DELETE payment method (Protected)
    router.delete('/:value', controller.deletePaymentMethod);

    return router;
}

module.exports = {
    createCategoriesRoutes,
    createProtectedCategoriesRoutes,
    createPaymentMethodsRoutes,
    createProtectedPaymentMethodsRoutes
};
