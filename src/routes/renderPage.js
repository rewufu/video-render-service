const Router = require("koa-router");
const { createJob } = require("../services/jobStore");
const { enqueue } = require("../services/workerPool");

const router = new Router();

router.post("/api/renderPage", async (ctx) => {
  const body = ctx.request.body || {};
  if (!body.pageId) {
    ctx.status = 400;
    ctx.body = { code: "400", msg: "pageId required" };
    return;
  }

  const job = createJob("renderPage", body);
  enqueue(job);

  ctx.body = { code: "0000", data: { jobId: job.id } };
});

module.exports = router;
