import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();
router.route("/profile").get(verifyJWT, (req, res) => {
  res.status(200).json({ message: "Authenticated user", user: req.user });
});

// Public routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser)

export default router;