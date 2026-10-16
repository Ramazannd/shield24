const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    login,
    getApplications,
    updateApplicationStatus,
    deleteApplication,
    getBlacklist,
    createBlacklistCompany,
    deleteBlacklistCompany
} = require('../controllers/adminController');

router.post('/login', login);
router.get('/applications', authMiddleware, getApplications);
router.patch('/applications/:id/status', authMiddleware, updateApplicationStatus);
router.delete('/applications/:id', authMiddleware, deleteApplication);
router.get('/blacklist', authMiddleware, getBlacklist);
router.post('/blacklist', authMiddleware, createBlacklistCompany);
router.delete('/blacklist/:id', authMiddleware, deleteBlacklistCompany);

module.exports = router;
