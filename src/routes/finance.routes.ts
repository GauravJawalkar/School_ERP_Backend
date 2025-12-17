import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { assignFees, createFeeHead, createFeeStructure, createFeeInstallment } from "../controllers/finance.controller";

const router = Router();

router
    .route('/createFeeHead')
    .post(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.create']),
        createFeeHead);

router
    .route('/createFeeStructure')
    .post(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.create']),
        createFeeStructure);

router
    .route('/assignFees/:id')
    .post(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.create']),
        assignFees);

router
    .route('/createFeeInstallment')
    .post(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.create']),
        createFeeInstallment
    )

export default router;