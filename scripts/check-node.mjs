const major = Number(process.versions.node.split(".")[0]);

if (major < 22) {
  console.error(
    `Node.js ${process.versions.node} nu poate porni aplicația. În terminal rulează: nvm use 22.23.2`,
  );
  process.exit(1);
}
