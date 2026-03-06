const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const path = require("path");

const renderPageRouter = require("./routes/renderPage");
const jobsRouter = require("./routes/jobs");
const mergeRouter = require("./routes/merge");

function createApp() {
  const app = new Koa();
  app.use(bodyParser({ jsonLimit: "2mb" }));

  // 静态输出：/outputs/...
  const outputsRoot = path.join(process.cwd(), "storage", "outputs");
  app.use(serve(outputsRoot));

  app.use(renderPageRouter.routes()).use(renderPageRouter.allowedMethods());
  app.use(jobsRouter.routes()).use(jobsRouter.allowedMethods());
  app.use(mergeRouter.routes()).use(mergeRouter.allowedMethods());

  return app;
}

module.exports = { createApp };
