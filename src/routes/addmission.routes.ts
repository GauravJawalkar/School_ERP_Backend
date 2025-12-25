import { Router } from "express";
import { approveAddmission, createAddmission, getAllAddmissions } from "../controllers/admission.controller";
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
    .route('/:instituteId/:yearId')
    .get(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        checkUserPersmission(['admission.view']),
        getAllAddmissions);

export default router