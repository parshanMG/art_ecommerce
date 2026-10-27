import { Router } from "express";

/* GET /api/products
   Returns every product with its availability. Where the list comes
   from depends on the mode (see index.js): the catalog file in
   portfolio mode, the database — with live reservations — in shop mode. */
export default function createProductsRouter(listProducts) {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await listProducts());
    } catch (err) {
      next(err);
    }
  });

  return router;
}
