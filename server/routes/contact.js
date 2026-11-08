import { Router } from "express";
import { handleContact } from "../contactForm.js";

/* POST /api/contact — the checks and emails live in contactForm.js,
   shared with the Cloudflare Worker. `deps` swaps out the email senders
   and the artwork lookup (the tests pass in fakes). */
export default function createContactRouter(deps = {}) {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const { status, body } = await handleContact(req.body, deps);
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
