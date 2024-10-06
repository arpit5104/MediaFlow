import { Router } from "express";
import { registerUser } from "../controlers/user.controler.js";

const   router = Router();

router.route("/register").post(registerUser);

export  default router 