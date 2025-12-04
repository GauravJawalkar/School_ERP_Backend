import { Router } from "express";
import { approveAddmission, createAddmission } from "../controllers/admission.controller";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { authenticateUser } from "../middlewares/authenticate.middleware";

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
        approveAddmission
    )

export default router