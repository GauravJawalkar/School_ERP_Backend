import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticate.middleware";
import { checkUserRoles } from "../middlewares/checkRoles.middleware";
import { checkUserPersmission } from "../middlewares/checkPermission.middleware";
import { superAdmin } from "../constants/auth.constants";
import {
    createPlan,
    updatePlan,
    createPrice,
    updatePrice,
    assignSubscription,
    getInstituteSubscriptionStatus,
    getAllSubscriptions,
    getPlans
} from "../controllers/saas.controller";
import { getLoggedInUserDetails } from "../services/auth.service";
import type { Request, Response, NextFunction } from "express";

const router = Router();

// Middleware to verify that a user is checking their own institute status or is a Super Admin
const checkInstituteStatusAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { isSuperAdmin, instituteId } = await getLoggedInUserDetails(req);
        const paramInstituteId = Number(req.params.instituteId);

        if (isSuperAdmin || instituteId === paramInstituteId) {
            return next();
        }

        return res.status(403).json({
            status: 403,
            success: false,
            message: "Access Denied: You do not have permission to view this institute's status"
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error during access validation"
        });
    }
};

// --- SUPER ADMIN ONLY ENDPOINTS ---
router.use(authenticateUser);

router.get(
    "/plans",
    checkUserRoles([superAdmin]),
    checkUserPersmission(["saas.subscription.manage"]),
    getPlans
);

router.post(
    "/plans",
    checkUserRoles([superAdmin]),
    checkUserPersmission(["saas.subscription.manage"]),
    createPlan
);

router.put(
    "/plans/:id",
    checkUserRoles([superAdmin]),
    checkUserPersmission(["saas.subscription.manage"]),
    updatePlan
);

router.post(
    "/prices",
    checkUserRoles([superAdmin]),
    checkUserPersmission(["saas.subscription.manage"]),
    createPrice
);

router.put(
    "/prices/:id",
    checkUserRoles([superAdmin]),
    checkUserPersmission(["saas.subscription.manage"]),
    updatePrice
);

router.post(
    "/subscriptions/assign",
    checkUserRoles([superAdmin]),
    checkUserPersmission(["saas.subscription.manage"]),
    assignSubscription
);

router.get(
    "/subscriptions",
    checkUserRoles([superAdmin]),
    checkUserPersmission(["saas.billing.view"]),
    getAllSubscriptions
);

// --- TENANT LEVEL ENDPOINTS (School Admins / Staff check their own status) ---
router.get(
    "/institute/:instituteId/status",
    checkInstituteStatusAccess,
    getInstituteSubscriptionStatus
);

export default router;
