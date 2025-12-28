import { Router } from "express";
import { approveAddmission, createAddmission, deleteAddmission, getAddmission, getAllAddmissions, restoreAdmission, softDeleteAddmission } from "../controllers/admission.controller";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";

const router = Router();

router
    .route('/createAddmission')
    .post(
        authenticateUser,
        checkUserPersmission(["admission.create"]),
        createAddmission);

router
    .route('/approveAdmission/:id')
    .post(
        authenticateUser,
        checkUserPersmission(['admission.update']),
        approveAddmission);

router
    .route('/:yearId')
    .get(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        checkUserPersmission(['admission.view']),
        getAllAddmissions);

router
    .route('/getAddmission/:addmissionId')
    .get(
        authenticateUser,
        checkUserPersmission(['admission.view']),
        getAddmission);

router
    .route('/:addmissionId')
    .delete(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        checkUserPersmission(['admission.delete']),
        deleteAddmission
    )

router
    .route('/:admissionId/soft')
    .patch(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        checkUserPersmission(['admission.delete']),
        softDeleteAddmission
    )

router
    .route('/:admissionId/restore')
    .patch(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        checkUserPersmission(['admission.create']),
        restoreAdmission
    );

export default router