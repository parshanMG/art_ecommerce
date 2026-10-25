import { Router } from "express";
import pool from "../db/index.js";
import { releaseExpiredReservations } from "../db/reservations.js";

const router = Router();

/* GET /api/products
   Returns all products with their live availability status. */
router.get("/", async (req, res, next) => {
  try {
    await releaseExpiredReservations(pool);

    const { rows } = await pool.query(
      `SELECT id, title, price, category, medium, dimensions,
              year, available, featured, image, thumbnail, description,
              title_fa, medium_fa, dimensions_fa, description_fa
       FROM products
       ORDER BY year DESC, title ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
