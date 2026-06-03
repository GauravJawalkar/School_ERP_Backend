import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { assignFees, createFeeHead, createFeeStructure, createFeeInstallment, generateInvoice, getFeeHeads, updateFeeStructure, deleteFeeStructure } from "../controllers/finance.controller";

const router = Router();

router
    .route('/createFeeHead')
    .post(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.create']),
        createFeeHead);

router
    .route('/feeHeads')
    .get(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.view']),
        getFeeHeads
    );

router
    .route('/createFeeStructure')
    .post(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.create']),
        createFeeStructure);

router
    .route('/feeStructure/:id')
    .patch(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.update']),
        updateFeeStructure
    )
    .delete(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.update']),
        deleteFeeStructure
    );

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


router
    .route('/generateInvoice')
    .post(
        authenticateUser,
        checkUserRoles(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['fees.create']),
        generateInvoice
    )
export default router;