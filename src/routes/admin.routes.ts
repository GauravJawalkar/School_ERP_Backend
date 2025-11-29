import { Router } from "express";
import { createAcademicYear } from "../controllers/admin.controller";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { authenticateUser } from "../middlewares/authenticate.middleware";

const router = Router();

router.route('/createAcademicYear')
    .post(authenticateUser, checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']), checkUserPersmission(['academic_year.create', 'academic_year.update']), createAcademicYear);

export default router