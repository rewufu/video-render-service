const { FFScene, FFText, FFCreator } = require("ffcreator");

const creator = new FFCreator({ width: 640, height: 360, fps: 30 });

const scene = new FFScene();
scene.setBgColor("#000000");
scene.setDuration(3);

const text = new FFText({
  text: "ffcreator OK",
  color: "#ffffff",
  fontSize: 88,
});
text.setXY(80, 120);
scene.addChild(text);

creator.addChild(scene);
creator.output("test.mp4");

creator.on("start", () => console.log("start"));
creator.on("process", (e) => console.log("process", e));
creator.on("complete", () => {
  console.log("done");
  process.exit(0);
});
creator.on("error", () => {
  console.error("error", e);
  process.exit(1);
});

creator.start();
