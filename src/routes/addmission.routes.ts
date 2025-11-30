import { Router } from "express";
import { createAddmission } from "../controllers/admission.controller";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";


const router = Router();

router.route('/createAddmission')
    .post(
        checkUserPersmission([
            "admission.view",
            "admission.create",
            "admission.update"]),
        createAddmission
    );

export default router