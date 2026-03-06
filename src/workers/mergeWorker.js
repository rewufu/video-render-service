// 把clips合并成final.mp4
// 后续加bgm/watermark

const fs = require("fs");
const path = require("path");
const { runFfmpeg } = require("../utils/ffmpeg");

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function readStdinJson() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return p;
}

function resolveClipPath(clip) {
  if (clip.clipPath) return clip.clipPath;

  // clipUrl 形如 "/<jobId>/page-001.mp4"
  if (clip.clipUrl) {
    const rel = clip.clipUrl.replace(/^\//, "");
    return path.join(process.cwd(), "storage", "outputs", rel);
  }
  return null;
}

async function main() {
  const jobId = process.env.JOB_ID;
  const payload = await readStdinJson();

  const clips = Array.isArray(payload.clips) ? payload.clips : [];
  if (clips.length === 0) throw new Error("clips required");

  const width = payload.width || 1280;
  const height = payload.height || 720;
  const fps = payload.fps || 30;

  const outDir = ensureDir(
    path.join(process.cwd(), "storage", "outputs", jobId),
  );
  const concatList = path.join(outDir, "concat.txt");
  const finalName = payload.outputName || "final.mp4";
  const finalPath = path.join(outDir, finalName);

  // 1) 写 concat.txt
  const lines = clips.map((c) => {
    const p = resolveClipPath(c);
    if (!p) throw new Error("clipPath or clipUrl required");
    if (!fs.existsSync(p)) throw new Error(`clip not found: ${p}`);
    return `file '${p.replace(/\\/g, "/")}'`;
  });
  fs.writeFileSync(concatList, lines.join("\n"), "utf8");

  send({ type: "progress", value: 10 });

  // 2) （转码统一参数）
  const args = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatList,

    // 统一帧率/分辨率（更像生产，减少不一致风险）
    "-r",
    String(fps),
    "-vf",
    `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,

    // 编码参数
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",

    // 音频统一
    "-c:a",
    "aac",
    "-b:a",
    "192k",

    finalPath,
  ];

  await runFfmpeg(args);

  send({ type: "progress", value: 80 });

  // 3) 音频同步

  send({
    type: "done",
    result: {
      videoPath: finalPath,
      videoUrl: `/${jobId}/${finalName}`,
    },
  });
}

main().catch((e) => {
  send({ type: "failed", error: String(e?.stack || e) });
  process.exit(1);
});
