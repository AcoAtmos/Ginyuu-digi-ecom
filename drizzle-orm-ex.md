Cara Pakai Setelah Migrasi
```
Jalankan dev:
bun run dev        # server utama port 4100
bun run admin      # admin panel port 3100
```

```
Setup database dari awal (pas deploy):
bun run setup-all  # drizzle-kit push — bikin semua tabel
```

```
Generate migration (kalau rubah schema):
bun run db:generate   # bikin file SQL migration
bun run db:migrate    # apply ke database
```

Ini penjelasan detail tentang Query Builder Drizzle dan semua operatornya.
🧱 Query Builder = "Penerjemah" JS ke SQL
Query builder adalah cara menulis query database pakai JavaScript, bukan string SQL. Drizzle otomatis mengubah kode JS-mu jadi SQL query yang aman.
📖 Operator Dasar
1. eq(a, b) — Equal (=)
// SQL: WHERE email = 'user@mail.com'
db.select().from(users).where(eq(users.email, "user@mail.com"))
2. ne(a, b) — Not Equal (!=)
// SQL: WHERE role != 'ADMIN'
db.select().from(users).where(ne(users.role, "ADMIN"))
3. gt(a, b) — Greater Than (>)
// SQL: WHERE price > 100000
db.select().from(product).where(gt(product.price, 100000))
4. gte(a, b) — Greater Than or Equal (>=)
// SQL: WHERE total >= 50000
db.select().from(orders).where(gte(orders.total, 50000))
5. lt(a, b) — Less Than (<)
6. lte(a, b) — Less Than or Equal (<=)
🔗 Logical Operators
7. and(...) — AND (semua harus true)
// SQL: WHERE role = 'ADMIN' AND email = 'admin@mail.com'
db.select().from(users).where(
  and(eq(users.role, "ADMIN"), eq(users.email, "admin@mail.com"))
)
8. or(...) — OR (salah satu true)
// SQL: WHERE status = 'pending' OR status = 'processing'
db.select().from(orders).where(
  or(eq(orders.status, "pending"), eq(orders.status, "processing"))
)
Gabung AND + OR:
// SQL: WHERE status = 'pending' AND (method = 'qris' OR method = 'bank')
db.select().from(orders).where(
  and(
    eq(orders.status, "pending"),
    or(eq(orders.paymentMethod, "qris"), eq(orders.paymentMethod, "bank"))
  )
)
9. not(...) — NOT (kebalikan)
// SQL: WHERE NOT status = 'completed'
db.select().from(orders).where(not(eq(orders.status, "completed")))
📋 Array Operators
10. inArray(col, values) — IN (...)
// SQL: WHERE id IN (1, 2, 3)
db.select().from(product).where(inArray(product.id, [1, 2, 3]))

// Sebelum pake raw pg: WHERE id = ANY($1::int[])
11. notInArray(col, values) — NOT IN
// SQL: WHERE id NOT IN (1, 2)
db.select().from(product).where(notInArray(product.id, [1, 2]))
12. isNull(col) / isNotNull(col) — IS NULL / IS NOT NULL
// SQL: WHERE phone IS NULL
db.select().from(users).where(isNull(users.phone))

// SQL: WHERE discount IS NOT NULL
db.select().from(product).where(isNotNull(product.discount))
🔤 String Operators
13. like(col, pattern) / ilike(col, pattern) — LIKE / ILIKE (pencarian teks)
// LIKE (case sensitive), ILIKE (case insensitive)
// SQL: WHERE name ILIKE '%desk%'
db.select().from(product).where(ilike(product.name, "%desk%"))
14. exists(subquery) — EXISTS
Cek apakah subquery mengembalikan baris:
const subquery = db.select().from(orders).where(eq(orders.userId, users.id));
db.select().from(users).where(exists(subquery));
📐 Order, Limit, Offset
15. desc(col) / asc(col) — ORDER BY
// SQL: ORDER BY created_at DESC
db.select().from(orders).orderBy(desc(orders.createdAt))

// SQL: ORDER BY price ASC, name DESC
db.select().from(product).orderBy(asc(product.price), desc(product.name))
16. .limit(n) / .offset(n) — LIMIT / OFFSET (pagination)
// SQL: LIMIT 10 OFFSET 20
db.select().from(product).limit(10).offset(20)
➕ INSERT
17. Basic Insert
// SQL: INSERT INTO users (email, password) VALUES ('a@b.com', 'hash') RETURNING id
const [user] = await db.insert(users).values({
  email: "a@b.com",
  password: hashedPassword
}).returning({ id: users.id })
18. onConflictDoNothing() — ON CONFLICT DO NOTHING
// SQL: INSERT INTO cart_items ... ON CONFLICT (user_id, product_id) DO NOTHING
await db.insert(cartItems).values({ userId, productId }).onConflictDoNothing()
19. onConflictDoUpdate() — ON CONFLICT DO UPDATE (upsert)
await db.insert(users).values({ email, name })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: sql`EXCLUDED.name` }
  })
✏️ UPDATE
// SQL: UPDATE users SET password = 'hash' WHERE id = 1
await db.update(users)
  .set({ password: hashedPassword })
  .where(eq(users.id, userId))
UPDATE dengan increment:
// SQL: UPDATE promo_codes SET used_count = used_count + 1 WHERE id = 1
await db.update(promoCodes)
  .set({ usedCount: sql`used_count + 1` })
  .where(eq(promoCodes.id, promoId))
// Kalau pake sql template, kolom pake snake_case karna itu SQL asli
🗑️ DELETE
// SQL: DELETE FROM cart_items WHERE user_id = 1 AND product_id = 2
await db.delete(cartItems)
  .where(and(eq(cartItems.userId, uid), eq(cartItems.productId, pid)))
🔗 JOIN
Drizzle pake .leftJoin(), .innerJoin(), .rightJoin(), .fullJoin():
// SQL: SELECT * FROM cart_items c JOIN product p ON c.product_id = p.id
await db.select()
  .from(cartItems)
  .leftJoin(product, eq(cartItems.productId, product.id))
SELECT kolom spesifik dari JOIN:
const rows = await db.select({
  cartId: cartItems.id,
  productName: product.name,
  productPrice: product.price
}).from(cartItems)
  .leftJoin(product, eq(cartItems.productId, product.id))
  .where(eq(cartItems.userId, userId))
🏦 TRANSACTION
Sebelum pakai ORM, kamu manual BEGIN / COMMIT / ROLLBACK:
const client = await db.connect();
try {
  await client.query("BEGIN");
  await client.query("INSERT INTO orders ...");
  await client.query("COMMIT");
} catch {
  await client.query("ROLLBACK");
} finally {
  client.release();
}
Sekarang pake Drizzle — auto rollback kalau error:
await db.transaction(async (tx) => {
  await tx.insert(orders).values({ userId, total: 50000 });
  // Kalau error di sini, semua INSERT sebelumnya di-rollback otomatis
  await tx.insert(orderItems).values({ ... });
  // Commit otomatis kalau semua sukses
});
🎯 sql Template Tag — Untuk Query Kompleks
Ada kalanya query terlalu kompleks buat query builder (CTE, json_agg, GROUP BY rumit). Drizzle tetap bisa handle via sql:
const { sql } = require("drizzle-orm");

const result = await db.execute(sql`
  WITH cart_tags AS (
    SELECT DISTINCT unnest(tags) AS tag FROM product WHERE id = ANY(${ids}::int[])
  )
  SELECT p.* FROM product p
  WHERE p.tags && ARRAY(SELECT tag FROM cart_tags)
`);

// result.rows -> array hasil query
Parameter otomatis di-escape (aman dari SQL injection):
await db.execute(sql`
  UPDATE queue SET status = 'sent' WHERE id = ${rowId}
`);
// Bukan ${rowId} dimasukkan langsung, tapi jadi $1 parameterized query