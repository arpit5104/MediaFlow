import { Router } from "express";
import { changeUserPassword, getCurrentUser, getUserChanneProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetail, updateUserAvatar, updateUserCoverImage } from "../controlers/user.controler.js";
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
router.route("/change-password").post(verifyJWT, changeUserPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetail)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChanneProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export  default router