const clients = ["gameHost", "player", "gameAdmin"];

console.log("Bouwen van clients gestart... 🚀");

for (const client of clients) {
  const result = await Bun.build({
    entrypoints: [`./${client}/index.ts`],
    outdir: `./docs/${client}`,
    target: "browser",
    minify: true,
  });

  if (!result.success) {
    console.error(`❌ Fout bij het bouwen van ${client}:`);
    console.error(result.logs);
  } else {
    console.log(`✅ ${client} succesvol gebouwd naar ./docs/${client}`);
  }
}
export { };

