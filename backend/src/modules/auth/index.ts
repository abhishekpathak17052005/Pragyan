/**
 * Auth Module - Main Export
 */

import authRoutes from "./routes";

export default authRoutes;

export * from "./constants";
export * from "./errors";
export * from "./validators";
export * from "./types";
export * from "./middleware";
export * from "./events";
export { AuthController } from "./controller";
export * from "./repository";
