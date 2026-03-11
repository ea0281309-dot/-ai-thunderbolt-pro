// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error." });
}

module.exports = errorHandler;
