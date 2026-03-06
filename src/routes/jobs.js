const Router = require("koa-router");
const { getJob } = require("../services/jobStore");

const router = new Router();

router.get("/api/jobs/:id", async (ctx) => {
  const job = getJob(ctx.params.id);
  if (!job) {
    ctx.status = 404;
    ctx.body = { code: "404", msg: "job not found" };
    return;
  }
  ctx.body = { code: "0000", data: job };
});

module.exports = router;
