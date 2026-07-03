export const aiErrorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    message: err.message || "AI assistant request failed.",
    code: err.code || "AI_REQUEST_ERROR"
  });
};
