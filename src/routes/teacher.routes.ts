import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { checkSubscriptionLimits } from "../middlewares/checkSubscriptionLimits.middleware";
import {
    getTeachers,
    createTeacher,
    updateTeacher,
    toggleTeacherStatus
} from "../controllers/teacher.controller";

const router = Router();

router
    .route("/")
    .get(
        authenticateUser,
        checkUserPersmission(["teacher.view"]),
        getTeachers
    )
    .post(
        authenticateUser,
        checkSubscriptionLimits({ limitType: 'staff', module: 'teacher' }),
        checkUserPersmission(["teacher.create"]),
        createTeacher
    );

router
    .route("/allTeachers")
    .get(
        authenticateUser,
        checkUserPersmission(["teacher.view"]),
        getTeachers
    );

router
    .route("/createTeacher")
    .post(
        authenticateUser,
        checkSubscriptionLimits({ limitType: 'staff', module: 'teacher' }),
        checkUserPersmission(["teacher.create"]),
        createTeacher
    );

router
    .route("/updateTeacher/:userId")
    .put(
        authenticateUser,
        checkUserPersmission(["teacher.update"]),
        updateTeacher
    );

router
    .route("/toggleStatus/:userId")
    .patch(
        authenticateUser,
        checkUserPersmission(["teacher.update"]),
        toggleTeacherStatus
    );

router
    .route("/:userId")
    .put(
        authenticateUser,
        checkUserPersmission(["teacher.update"]),
        updateTeacher
    )
    .patch(
        authenticateUser,
        checkUserPersmission(["teacher.update"]),
        toggleTeacherStatus
    );

export default router;
