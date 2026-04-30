import { Router } from "express";
import pool from "../db/index.js";

const router = Router();

/* GET /api/products
   Returns all products with their live availability status. */
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, price, category, medium, dimensions,
              year, available, featured, image, thumbnail, description
       FROM products
       ORDER BY year DESC, title ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
