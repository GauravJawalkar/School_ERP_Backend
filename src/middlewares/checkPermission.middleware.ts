import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

interface PermissionCheckOptions {
    mode?: "ANY" | "ALL";
    allowSuperAdmin?: boolean;
}

const checkUserPermission = (
    requiredPermissions: string[] = [],
    options: PermissionCheckOptions = { mode: "ANY", allowSuperAdmin: true }
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required. Please login."
                });
            }

            if (typeof req.user === "string") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token payload."
                });
            }

            const user = req.user as JwtPayload & { permissions?: string[]; roles?: string[] };
            const userPermissions = user.permissions || [];
            const userRoles = user.roles || [];

            // 1. Super Admin bypass (Platform Owner has root access)
            if (options.allowSuperAdmin !== false && userRoles.includes("SUPER_ADMIN")) {
                return next();
            }

            // 2. Wildcard bypass (if user has global '*' permission)
            if (userPermissions.includes("*")) {
                return next();
            }

            // If no specific permissions are required, proceed
            if (requiredPermissions.length === 0) {
                return next();
            }

            // Helper to check if user has a single permission (including module wildcard e.g. "student.*")
            const checkSingle = (perm: string) => {
                if (userPermissions.includes(perm)) return true;
                const modulePrefix = perm.split(".")[0];
                return userPermissions.includes(`${modulePrefix}.*`);
            };

            const isAllowed = options.mode === "ALL"
                ? requiredPermissions.every(checkSingle)
                : requiredPermissions.some(checkSingle);

            if (!isAllowed) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You don't have the required permissions.",
                    required: requiredPermissions,
                    userHas: userPermissions
                });
            }

            return next();
        } catch (error) {
            console.error("Error in check permission middleware:", error);
            return res.status(500).json({
                success: false,
                error: "Internal server error in check permission middleware"
            });
        }
    };
};

// Backwards compatibility alias
const checkUserPersmission = checkUserPermission;

export { checkUserPermission, checkUserPersmission };