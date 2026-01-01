import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { getStudentProfile, getStudentsByClassOrSection, getStuentsForSchool, transferStudent, updateStudent } from "../controllers/student.controller";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";

const router = Router();

router
    .route('/:studentId/getProfile')
    .get(
        authenticateUser,
        checkUserPersmission(['student.view']),
        getStudentProfile
    )

router
    .route('/')
    .get(
        authenticateUser,
        checkUserPersmission(['student.view']),
        getStuentsForSchool
    )

router
    .route('/class/:classId')
    .get(
        authenticateUser,
        checkUserPersmission(['student.view']),
        getStudentsByClassOrSection
    )

router
    .route('/section/:sectionId')
    .get(
        authenticateUser,
        checkUserPersmission(['student.view']),
        getStudentsByClassOrSection
    )

router
    .route('/:studentId/transfer')
    .post(
        authenticateUser,
        checkUserPersmission(['student.update']),
        transferStudent
    )

router
    .route('/:studentId/update')
    .put(
        authenticateUser,
        checkUserPersmission(['student.update']),
        updateStudent
    )

export default router;