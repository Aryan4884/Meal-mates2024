import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  getPaymentDetails,
  makePayment,
  registerFoodComplaint,
  getFoodComplaints,
  getAllUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getAllUser", getAllUser);

// Secured routes
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.get("/current-user", verifyJWT, getCurrentUser);
router.get("/get-payment-details", getPaymentDetails);
router.post("/create-checkout-session", makePayment);
router.post("/register-complaint", registerFoodComplaint);
router.get("/get-complaint", getFoodComplaints);

export default router;
