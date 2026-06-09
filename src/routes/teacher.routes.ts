import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
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
        checkUserPersmission(["teacher.create"]),
        createTeacher
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
        checkUserPersmission(["teacher.update"]), // using update permission to toggle active state
        toggleTeacherStatus
    );

export default router;
