import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { createFeeHead } from "../controllers/finance.controller";

const router = Router();

router
    .route('/createFeeHead')
    .post(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.create']),
        createFeeHead);

export default router;