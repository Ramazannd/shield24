const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Пароль:', password);
    console.log('Хеш:', hash);
    console.log('\nSQL для вставки:');
    console.log(`DELETE FROM admins WHERE email = 'admin@chop.ru';`);
    console.log(`INSERT INTO admins (email, password_hash) VALUES ('admin@chop.ru', '${hash}');`);
}

generateHash();
