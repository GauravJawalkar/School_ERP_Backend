import { Router } from "express";
import { signupUser } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route('/signup').post(upload.fields(
    [
        {
            name: 'profileImage',
            maxCount: 1
        }
    ]
), signupUser)

export default router