import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controlers/user.controler.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const   router = Router();

router.route("/register").post(
    upload.fields([{name:"avatar",maxCount:1},{name:"coverImage",maxCount:1}]),//multer midleware injection
    registerUser
);

router.route("/login").post(loginUser);

//Secured routes

router.route("/logout").post( verifyJWT  ,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export  default router 