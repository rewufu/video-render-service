const { spawn } = require("child_process");

function ffmpegBin() {
  return process.env.FFMPEG_PATH && process.env.FFMPEG_PATH.trim()
    ? process.env.FFMPEG_PATH.trim()
    : "ffmpeg";
}

function runFfmpeg(args, { onStderr } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegBin(), args, { stdio: ["ignore", "ignore", "pipe"] });
    p.stderr.on("data", (b) => onStderr && onStderr(b.toString("utf8")));
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)),
    );
  });
}

module.exports = { runFfmpeg };
