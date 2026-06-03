const { db } = require("./config/db");
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  console.log('\n=== Ginyuu Admin Seeder ===\n');
  const action = await ask('What do you want to do?\n  1. Create new admin user\n  2. Promote existing user to ADMIN\n  3. Change user password\nChoose (1/2/3): ');

  if (action === '1') {
    const username = await ask('Username: ');
    const email = await ask('Email: ');
    const password = await ask('Password: ');
    const hashed = await bcrypt.hash(password, 10);
    try {
      await db.query(
        `INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, 'ADMIN')`,
        [username, email, hashed]
      );
      console.log(`\n✓ Admin user "${username}" created successfully!\n`);
    } catch (err) {
      if (err.message.includes('duplicate')) {
        console.log(`\n✗ Email already exists. Use option 2 to promote.\n`);
      } else {
        console.log(`\n✗ Error: ${err.message}\n`);
      }
    }
  } else if (action === '2') {
    const email = await ask('Email of user to promote: ');
    const { rows } = await db.query(`SELECT id, username, email, role FROM users WHERE email = $1`, [email]);
    if (rows.length === 0) {
      console.log('\n✗ User not found\n');
    } else {
      const user = rows[0];
      console.log(`\nFound: ${user.username} (${user.email}) — current role: ${user.role}`);
      const confirm = await ask(`Promote to ADMIN? (y/n): `);
      if (confirm.toLowerCase() === 'y') {
        await db.query(`UPDATE users SET role = 'ADMIN' WHERE id = $1`, [user.id]);
        console.log(`\n✓ ${user.username} is now an ADMIN!\n`);
      }
    }
  } else if (action === '3') {
    const email = await ask('Email: ');
    const { rows } = await db.query(`SELECT id, username FROM users WHERE email = $1`, [email]);
    if (rows.length === 0) {
      console.log('\n✗ User not found\n');
    } else {
      const password = await ask('New password: ');
      const hashed = await bcrypt.hash(password, 10);
      await db.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, rows[0].id]);
      console.log(`\n✓ Password updated for ${rows[0].username}\n`);
    }
  }

  rl.close();
  process.exit(0);
}

main();
