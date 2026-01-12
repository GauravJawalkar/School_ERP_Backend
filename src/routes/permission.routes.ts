import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { addSpecificPermissionsToRole, assignCustomRole } from "../controllers/permissions.controller";

const router = Router();

router
    .route('/assign')
    .post(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        assignCustomRole
    )

router
    .route('/add')
    .put(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        addSpecificPermissionsToRole
    )

export default router