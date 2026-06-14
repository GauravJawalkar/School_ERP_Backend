import { Router } from "express";
import { createAcademicYear, createStaff, getAcademicYears, getAllSchoolAdmins, getSchoolAdmins, getStaffByInstitute, getUnifiedSchoolDirectory, updateAcademicYearStatus, updateStaff, deleteStaff } from "../controllers/admin.controller";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { accountant, schoolAdmin, superAdmin } from "../constants/auth.constants";

const router = Router();
// Create academic year for school (Super Admin Only)
router
    .route('/createAcademicYear')
    .post(
        authenticateUser,
        checkUserRoles([superAdmin]),
        checkUserPersmission(['academic_year.create']),
        createAcademicYear
    );

// Update status of academic year (Super Admin Only)
router
    .route('/updateAcademicYearStatus')
    .put(
        authenticateUser,
        checkUserRoles([superAdmin]),
        checkUserPersmission(['academic_year.update']),
        updateAcademicYearStatus
    );

// Create or add a staff for school
router
    .route('/createStaff')
    .post(
        authenticateUser, checkUserRoles([superAdmin, schoolAdmin]),
        checkUserPersmission(["staff.create"]),
        createStaff
    );

router
    .route('/directory')
    .get(
        authenticateUser,
        checkUserRoles([superAdmin, schoolAdmin, accountant]),
        getUnifiedSchoolDirectory
    );

router
    .route('/staff')
    .get(
        authenticateUser,
        checkUserRoles([superAdmin, schoolAdmin, accountant]),
        checkUserPersmission(['staff.view']),
        getStaffByInstitute
    );

router
    .route('/staff/:id')
    .put(
        authenticateUser,
        checkUserRoles([superAdmin, schoolAdmin]),
        checkUserPersmission(['staff.update']),
        updateStaff
    )
    .delete(
        authenticateUser,
        checkUserRoles([superAdmin, schoolAdmin]),
        checkUserPersmission(['staff.delete']),
        deleteStaff
    );

router
    .route('/academicYears')
    .get(
        authenticateUser,
        checkUserPersmission(['academic_year.view']),
        getAcademicYears
    )

router
    .route('/allAdmins')
    .get(
        authenticateUser,
        checkUserRoles([superAdmin]),
        getAllSchoolAdmins
    )

router
    .route('/:slug')
    .get(
        authenticateUser,
        checkUserRoles([superAdmin, schoolAdmin]),
        getSchoolAdmins
    )

export default router