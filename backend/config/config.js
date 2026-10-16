module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
    jwtExpire: '24h',
    
    // Статусы заявок
    applicationStatuses: {
        NEW: 'new',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        REJECTED: 'rejected'
    },
    
    // Услуги
    services: [
        'Физическая охрана',
        'Пультовая охрана',
        'Сопровождение грузов',
        'Личная охрана',
        'Охрана мероприятий',
        'Монтаж систем безопасности'
    ]
};
