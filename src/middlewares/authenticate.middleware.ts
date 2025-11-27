import type { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError, type JwtPayload } from "jsonwebtoken";
import type { TokenUser } from "../interface";
import { generateAccessToken } from "../helpers/tokenGenerator";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload | string;
        }
    }
}

const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenHeader = req.headers.authorization;

        if (!tokenHeader) {
            return res.status(401).json({ message: "Unauthorized : Please Login", status: 401 })
        }

        if (!tokenHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Invalid token format. Token must start with 'Bearer '", status: 401 })
        }

        const token = tokenHeader.split(" ")[1]?.trim();

        // Validate the token existence
        if (!token) {
            return res.status(401).json({ message: "Token is missing", status: 401 });
        }

        if (!process.env.ACCESS_TOKEN_SECRET) {
            return res.status(500).json({ message: "JWT_SECRET is not configured", status: 500 })
        }

        try {
            // If the accessToken exist and is not expired then just go to the next function in the route.
            const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            req.user = decodedUser;
            next();
        } catch (error) {
            // Refresh the expired AccessToken Logic
            if (error instanceof TokenExpiredError) {
                const refreshToken = req.cookies?.refreshToken;
                if (!refreshToken) return res.status(401).json({ message: "Login Again", status: 401 });
                try {
                    const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as TokenUser;

                    const payload: TokenUser = {
                        id: user?.id,
                        firstName: user?.firstName,
                        lastName: user?.lastName,
                        email: user?.email,
                        gender: user?.gender,
                        instituteId: user?.id,
                        phone: user?.phone,
                        profileImage: user?.profileImage || "",
                        permissions: user?.permissions,
                        roles: user?.roles
                    }

                    const newAccessToken = generateAccessToken(payload);

                    res.setHeader("Authorization", `Bearer ${newAccessToken}`);
                    req.user = user;
                    next();

                } catch (error) {
                    if (error instanceof TokenExpiredError) return res.status(401).json({ message: "Refresh Token Expired", status: 401 });
                }

                return res.status(401).json({ error: "Token Expired" });
            }

            // After the refreshing accessToken it gives a JsonWebTokenError then the token is invalid or someone is giving the wrong auth token
            if (error instanceof JsonWebTokenError) {
                return res.status(401).json({ error: "Invalid Token" });
            }
            throw error;
        }

    } catch (error) {
        console.error("Authentication Middleware Error: ", error);
        return res.status(500).json({ message: "Internal Server Error", status: 500 });
    }
}

export { authenticateUser }