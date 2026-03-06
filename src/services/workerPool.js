// 并发控制+起worker子进程

const path = require("path");
const { spawn } = require("child_process");
const { patchJob } = require("./jobStore");

const concurrency = Number(process.env.RENDER_CONCURRENCY || 1);
let running = 0;
const queue = [];

function enqueue(job) {
  queue.push(job);
  tick();
}

function tick() {
  if (running >= concurrency) return;

  const job = queue.shift();
  if (!job) return;

  running += 1;

  runJob(job)
    .catch(() => {})
    .finally(() => {
      running -= 1;
      tick();
    });
}

// 🔥 根据 job.type 选择 worker
function workerFileFor(job) {
  if (job.type === "renderPage") {
    return path.join(process.cwd(), "src", "workers", "renderPageWorker.js");
  }

  if (job.type === "merge") {
    return path.join(process.cwd(), "src", "workers", "mergeWorker.js");
  }

  throw new Error(`Unknown job type: ${job.type}`);
}

function runJob(job) {
  return new Promise((resolve, reject) => {
    patchJob(job.id, { status: "running", progress: 1, error: null });

    const workerFile = workerFileFor(job);

    const child = spawn(process.execPath, [workerFile], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, JOB_ID: job.id },
    });

    child.stdout.on("data", (buf) => {
      const lines = buf.toString("utf8").split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const msg = JSON.parse(line);

          if (msg.type === "progress") {
            patchJob(job.id, { progress: msg.value });
          }

          if (msg.type === "done") {
            patchJob(job.id, {
              status: "done",
              progress: 100,
              result: msg.result,
            });
          }

          if (msg.type === "failed") {
            patchJob(job.id, {
              status: "failed",
              error: msg.error,
            });
          }
        } catch {}
      }
    });

    child.stderr.on("data", (buf) => {
      patchJob(job.id, {
        error: buf.toString("utf8").slice(0, 2000),
      });
    });

    child.on("exit", (code) => {
      if (code === 0) return resolve();

      const current = patchJob(job.id, {});
      if (!current || current.status !== "failed") {
        patchJob(job.id, {
          status: "failed",
          error: `worker exit ${code}`,
        });
      }

      reject(new Error(`worker exit ${code}`));
    });

    child.stdin.write(JSON.stringify(job.payload));
    child.stdin.end();
  });
}

module.exports = { enqueue };
