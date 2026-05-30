import { Router } from "express";
import { getRolesList } from "../controllers/role.controller";
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

export default router;