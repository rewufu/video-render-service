const Router = require("koa-router");
const { createJob } = require("../services/jobStore");
const { enqueue } = require("../services/workerPool");

const router = new Router();

router.post("/api/merge", async (ctx) => {
  const body = ctx.request.body || {};
  const clips = Array.isArray(body.clips) ? body.clips : [];
  if (clips.clips === 0) {
    ctx.status = 400;
    ctx.body = { code: "400", msg: "clips required" };
    return;
  }

  const job = createJob("merge", {
    outputName: body.name || "final.mp4",
    width: body.width || 1920,
    height: body.height || 1080,
    fps: body.fps || 30,
    clips,
  });
  enqueue(job);
  ctx.body = { code: "0000", data: { jobId: job.id } };
});

module.exports = router;
