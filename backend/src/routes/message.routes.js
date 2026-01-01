import Router from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controllers.js";

const router = Router();

router.route("/users").get(verifyJWT, getUsersForSidebar);
router.route("/:id").get(verifyJWT, getMessages);
router.route("/send/:id").post(verifyJWT, sendMessage);

export default router;