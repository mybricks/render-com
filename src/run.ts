export function run(comJson) {
  comJson.runtime = new Function(`return ${comJson.runtime}`)();
  comJson.editors = new Function(`return ${comJson.editors}`)()();
  comJson.upgrade = new Function(`return ${comJson.upgrade}`)();

  return comJson;
}
