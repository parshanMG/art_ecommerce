import { Router } from "express";

const router = Router();

/* GET /api/products
   Returns all products with their live availability status. */
router.get("/", async (req, res, next) => {
  // TODO: query products table and return rows
});

export default router;
