export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const showStack = process.env.NODE_ENV !== "production" && process.env.SHOW_ERROR_STACK === "true";

  res.status(statusCode).json({
    message: err.message || "Server error",
    stack: showStack ? err.stack : undefined
  });
};
