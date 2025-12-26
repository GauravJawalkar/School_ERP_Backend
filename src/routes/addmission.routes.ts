import { Router } from "express";
import { approveAddmission, createAddmission, getAddmission, getAllAddmissions } from "../controllers/admission.controller";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { authenticatedRole } from "drizzle-orm/neon";

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

router
    .route('/:instituteId/:addmissionId')
    .get(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        checkUserPersmission(['admission.view']),
        getAddmission
    )
export default router