const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { normalizeCompanyName } = require('./applicationController');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Введите email и пароль' });
        }

        const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const admin = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            { adminId: admin.id, email: admin.email },
            config.jwtSecret,
            { expiresIn: config.jwtExpire }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            token,
            admin: { id: admin.id, email: admin.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка при входе' });
    }
};

const getApplications = async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let queryText = 'SELECT * FROM applications';
        const params = [];

        if (status) {
            queryText += ' WHERE status = $1';
            params.push(status);
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(queryText, params);
        const countResult = await db.query(
            'SELECT COUNT(*) FROM applications' + (status ? ' WHERE status = $1' : ''),
            status ? [status] : []
        );

        res.json({
            success: true,
            applications: result.rows,
            total: parseInt(countResult.rows[0].count, 10),
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        });
    } catch (error) {
        console.error('Error getting applications:', error);
        res.status(500).json({ error: 'Ошибка при получении заявок' });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['new', 'in_progress', 'completed', 'rejected'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус' });
        }

        const result = await db.query(
            'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }

        res.json({
            success: true,
            message: 'Статус обновлен',
            application: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ error: 'Ошибка при обновлении статуса' });
    }
};

const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM applications WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заявка не найдена' });
        }

        res.json({
            success: true,
            message: 'Заявка удалена'
        });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ error: 'Ошибка при удалении заявки' });
    }
};

const getBlacklist = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM blacklisted_companies ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            companies: result.rows
        });
    } catch (error) {
        console.error('Error getting blacklist:', error);
        res.status(500).json({ error: 'Ошибка при получении черного списка' });
    }
};

const createBlacklistCompany = async (req, res) => {
    try {
        const { companyName, reason } = req.body;

        if (!companyName) {
            return res.status(400).json({ error: 'Укажите название компании' });
        }

        const normalizedName = normalizeCompanyName(companyName);

        const result = await db.query(
            `
                INSERT INTO blacklisted_companies (company_name, normalized_name, reason)
                VALUES ($1, $2, $3)
                ON CONFLICT (normalized_name) DO UPDATE
                SET company_name = EXCLUDED.company_name,
                    reason = EXCLUDED.reason
                RETURNING *
            `,
            [companyName.trim(), normalizedName, reason || null]
        );

        res.status(201).json({
            success: true,
            message: 'Компания добавлена в черный список',
            company: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating blacklist company:', error);
        res.status(500).json({ error: 'Ошибка при сохранении компании' });
    }
};

const deleteBlacklistCompany = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'DELETE FROM blacklisted_companies WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Компания не найдена' });
        }

        res.json({
            success: true,
            message: 'Компания удалена из черного списка'
        });
    } catch (error) {
        console.error('Error deleting blacklist company:', error);
        res.status(500).json({ error: 'Ошибка при удалении компании' });
    }
};

module.exports = {
    login,
    getApplications,
    updateApplicationStatus,
    deleteApplication,
    getBlacklist,
    createBlacklistCompany,
    deleteBlacklistCompany
};
