import { Router } from "express";
import { forgotPassword, loginUser, refreshToken, resetPassword, signupUser, updateProfile } from "../controllers/auth.controller";
import { upload } from "../middlewares/multer.middleware";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";

const router = Router();

router.route('/signup').post(upload.fields(
    [
        {
            name: 'profileImage',
            maxCount: 1
        }
    ]
), signupUser);
router.route('/login').post(loginUser);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword').post(resetPassword);
router.route('/refreshToken').post(refreshToken);
router.route('/updateProfile').patch(
    authenticateUser,
    checkUserPersmission(['user.update']),
    updateProfile
);

export default router;