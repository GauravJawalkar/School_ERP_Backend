import { Router } from "express";
import { getRolesList, createRole, updateRolePermissions, getPermissionsList, deleteRole } from "../controllers/role.controller";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";

const router = Router();

router
    .route('/getAllRoles')
    .get(
        authenticateUser,
        checkUserPersmission(['role.view', 'role.create', 'role.update', 'role.delete']),
        getRolesList
    );

router
    .route('/getAllPermissions')
    .get(
        authenticateUser,
        checkUserPersmission(['role.view']),
        getPermissionsList
    );

router
    .route('/createRole')
    .post(
        authenticateUser,
        checkUserPersmission(['role.create']),
        createRole
    );

router
    .route('/updateRolePermissions')
    .put(
        authenticateUser,
        checkUserPersmission(['role.update']),
        updateRolePermissions
    );

router
    .route('/deleteRole')
    .delete(
        authenticateUser,
        checkUserPersmission(['role.delete']),
        deleteRole
    );

export default router;