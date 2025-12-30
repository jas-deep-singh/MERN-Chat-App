import { Router } from "express";
import { userLogIn, userLogOut, userSignUp, updateProfilePic, checkAuth } from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/signup").post(userSignUp); 
router.route("/login").post(userLogIn);

router.route("/logout").post(verifyJWT, userLogOut);
router.route("/update-profile-pic").put(verifyJWT, updateProfilePic);
router.route("/check").get(verifyJWT, checkAuth);

export default router;