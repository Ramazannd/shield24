require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const ensureSchema = require('./backend/db/ensureSchema');
const applicationsRouter = require('./backend/routes/applications');
const adminRouter = require('./backend/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'backend/public')));
app.use(express.static(path.join(__dirname, 'backend/views')));

app.use('/api/applications', applicationsRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'backend/views/index.html'));
});

app.use((req, res) => {
    res.status(404).json({ error: 'Страница не найдена' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Что-то пошло не так' });
});

async function startServer() {
    try {
        await ensureSchema();

        app.listen(PORT, () => {
            console.log(`Server started at http://localhost:${PORT}`);
            console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
}

startServer();
