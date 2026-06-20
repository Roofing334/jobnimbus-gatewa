const http = require("node:http");
const { loadConfig } = require("./config");
const { handleRequest, errorHandler } = require("./router");

const config = loadConfig();

const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res, config);
  } catch (error) {
    errorHandler(res, error);
  }
});

server.listen(config.port, () => {
  console.log(`JobNimbus gateway listening on http://localhost:${config.port}`);
  console.log("SERVER BOOT: updated router.js mounted for JobNimbus search");
});
