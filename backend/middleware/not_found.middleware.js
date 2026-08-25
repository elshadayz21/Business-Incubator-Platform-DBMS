import { NotFoundError } from "../utils/error.js";

export const notFoundMiddleware = (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
};
