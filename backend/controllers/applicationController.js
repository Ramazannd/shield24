const db = require('../config/db');

function normalizeCompanyName(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

const createApplication = async (req, res) => {
    try {
        const { name, company, phone, email, service, message } = req.body;

        if (!name || !company || !phone || !service) {
            return res.status(400).json({
                error: 'Заполните обязательные поля: имя, компания, телефон и услуга'
            });
        }

        const normalizedCompany = normalizeCompanyName(company);
        const blacklistResult = await db.query(
            'SELECT id FROM blacklisted_companies WHERE normalized_name = $1 LIMIT 1',
            [normalizedCompany]
        );

        if (blacklistResult.rows.length > 0) {
            return res.status(403).json({
                error: 'Заявки от этой компании временно не принимаются'
            });
        }

        const queryText = `
            INSERT INTO applications (name, company, phone, email, service, message, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'new')
            RETURNING *
        `;

        const result = await db.query(queryText, [
            name,
            company,
            phone,
            email || null,
            service,
            message || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Заявка успешно отправлена. Мы свяжемся с вами в ближайшее время.',
            application: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ error: 'Ошибка при отправке заявки' });
    }
};

module.exports = {
    createApplication,
    normalizeCompanyName
};
