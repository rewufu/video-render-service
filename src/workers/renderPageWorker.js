const path = require("path");
const fs = require("fs");

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

async function main() {
  const jobId = process.env.JOB_ID;
  const payload = await readStdinJson();

  const { FFScene, FFText, FFImage, FFCreator } = require("ffcreator");

  const pageId = payload.pageId || "page";
  const width = payload.output?.width ?? 1280;
  const height = payload.output?.height ?? 720;
  const fps = payload.output?.fps ?? 30;
  const duration = payload.output?.duration ?? 5;

  const outDir = ensureDir(
    path.join(process.cwd(), "storage", "outputs", jobId),
  );
  const outFile = path.join(outDir, `${pageId}.mp4`);

  const tracks = Array.isArray(payload.tracks) ? payload.tracks : [];
  const bg = tracks.find((t) => t.type === "image") || null;
  const txt = tracks.find((t) => t.type === "text") || {
    text: "Hello",
    x: 80,
    y: 80,
    fontSize: 48,
    color: "#ffffff",
  };

  send({ type: "progress", value: 5 });

  // scene
  const scene = new FFScene();
  scene.setBgColor("#000000");
  scene.setDuration(duration);

  if (bg?.src) {
    const img = new FFImage({ path: bg.src });
    img.setXY(width / 2, height / 2);
    img.setWH(width, height);
    scene.addChild(img);
  }

  const text = new FFText({
    text: txt.text ?? "Hello",
    color: txt.color ?? "#ffffff",
    fontSize: txt.fontSize ?? 48,
  });
  // 注意：FFText 的定位在不同版本可能是 setXY 或 setPosition，你 quick-test 用的那套就是对的
  text.setXY(txt.x ?? 80, txt.y ?? 80);
  scene.addChild(text);

  send({ type: "progress", value: 20 });

  // creator
  const creator = new FFCreator({ width, height, fps });
  creator.addChild(scene);
  creator.output(outFile);

  await new Promise((resolve, reject) => {
    creator.on("start", () => send({ type: "progress", value: 30 }));
    creator.on("progress", (e) => {
      const p = Math.min(
        99,
        Math.max(30, Math.floor((e?.progress ?? 0) * 70 + 30)),
      );
      send({ type: "progress", value: p });
    });
    creator.on("complete", () => resolve());
    creator.on("error", (err) => reject(err));
    creator.start();
  });

  send({
    type: "done",
    result: {
      pageId,
      clipPath: outFile,
      clipUrl: `/outputs/${jobId}/${pageId}.mp4`,
    },
  });
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e) + "\n");
  process.exit(1);
});
