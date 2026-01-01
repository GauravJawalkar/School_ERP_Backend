import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { getStudentProfile, getStuentsForSchool } from "../controllers/student.controller";
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

export default router;