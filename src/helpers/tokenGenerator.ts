import jwt from "jsonwebtoken"
import type { TokenUser } from "../interface"

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET!
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET!


const generateAccessToken = (user: TokenUser) => {
    return jwt.sign(user, accessTokenSecret, { expiresIn: '1m' })
}

const generateRefreshToken = (user: TokenUser) => {
    return jwt.sign(user, refreshTokenSecret, { expiresIn: '7d' })
}


export { generateAccessToken, generateRefreshToken }