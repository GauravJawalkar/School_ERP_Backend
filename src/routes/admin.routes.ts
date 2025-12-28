import { Router } from "express";
import { createAcademicYear, createStaff, getStaffByInstitute } from "../controllers/admin.controller";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { authenticateUser } from "../middlewares/authenticate.middleware";

const router = Router();
// Create academic year for school
router
    .route('/createAcademicYear')
    .post(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['academic_year.create']),
        createAcademicYear
    );

// Create or add a staff for school
router
    .route('/createStaff')
    .post(
        authenticateUser, checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
        checkUserPersmission(["staff.create"]),
        createStaff
    );

router
    .route('/staff')
    .get(
        authenticateUser,
        checkUserRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']),
        checkUserPersmission(['staff.view']),
        getStaffByInstitute
    )

export default router