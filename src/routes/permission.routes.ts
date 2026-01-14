import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { addSpecificPermissionsToRole, assignCustomRole, removeSpecificPermissionsFromRole, updateRoleName } from "../controllers/permissions.controller";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";

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

router
    .route('/edit')
    .patch(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        updateRoleName
    )

router
    .route('/remove')
    .put(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        checkUserPersmission(['user.assign_role', 'role.update', 'role.create']),
        removeSpecificPermissionsFromRole
    )

export default router