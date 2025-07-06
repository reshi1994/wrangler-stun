import fs from 'fs-extra';
import { execa } from 'execa';

const BINDING_NAME = 'LUCKY';
const D1_NAME = 'lucky';
const DEFAULT_NAME = 'webs';
const DEFAULT_PORT = 9999;
const WRANGLER_JSONC = './wrangler.jsonc';

// ✅ 检查是否存在数据库，不存在则创建
async function checkOrCreateDatabase(dbName) {
  const { stdout } = await execa('wrangler', ['d1', 'list', '--json']);
  const dbList = JSON.parse(stdout);
  let db = dbList.find(d => d.name === dbName);

  if (!db) {
    console.log(`⏳ 创建数据库 ${dbName}...`);
    const { stdout: created } = await execa('wrangler', ['d1', 'create', dbName, '--json']);
    db = JSON.parse(created);
    console.log(`✅ 数据库创建成功，ID: ${db.uuid}`);
  } else {
    console.log(`✅ 数据库已存在，ID: ${db.uuid}`);
  }

  await updateJsoncBinding(WRANGLER_JSONC, BINDING_NAME, D1_NAME, db.uuid);
  return db;
}

// ✅ 创建表并插入或更新默认数据
async function initSchema(dbName, defaultName, defaultPort) {
  const schema = `
CREATE TABLE IF NOT EXISTS stun (
  name TEXT PRIMARY KEY,
  port INTEGER
);
INSERT INTO stun (name, port) VALUES ('${defaultName}', ${defaultPort})
  ON CONFLICT(name) DO UPDATE SET port=excluded.port;
  `.trim();

  const tmpFile = './init.sql';
  await fs.writeFile(tmpFile, schema);
  console.log('📦 执行初始化 SQL...');
  await execa('wrangler', ['d1', 'execute', dbName, '--file', tmpFile, '--remote']);
  await fs.remove(tmpFile);
}

// ✅ 更新 wrangler.jsonc 中的绑定配置
function normalizeBinding(b) {
  return b.toLowerCase();
}

async function updateJsoncBinding(jsoncPath, binding, dbName, dbId) {
  let jsonData = {};
  if (await fs.exists(jsoncPath)) {
    const raw = await fs.readFile(jsoncPath, 'utf8');
    // 移除注释（jsonc => json）
    const noComments = raw.replace(/\/\/.*$/gm, '');
    jsonData = JSON.parse(noComments);
  }

  jsonData.d1_databases = jsonData.d1_databases || [];

  const duplicates = jsonData.d1_databases.filter(
    d => normalizeBinding(d.binding) === normalizeBinding(binding)
  );

  if (duplicates.length > 0) {
    const first = duplicates[0];
    first.binding = binding;
    first.database_name = dbName;
    first.database_id = dbId;

    jsonData.d1_databases = jsonData.d1_databases.filter(
      (d, i) =>
        normalizeBinding(d.binding) !== normalizeBinding(binding) || i === jsonData.d1_databases.indexOf(first)
    );

    console.log(`📝 已更新并清理重复 binding="${binding}"`);
  } else {
    jsonData.d1_databases.push({
      binding,
      database_name: dbName,
      database_id: dbId
    });
    console.log(`➕ 已追加 binding="${binding}" 到 wrangler.jsonc`);
  }

  const updated = JSON.stringify(jsonData, null, 2);
  await fs.writeFile(jsoncPath, updated + '\n');
}

// ✅ 主函数
async function main() {
  const db = await checkOrCreateDatabase(D1_NAME);
  await initSchema(D1_NAME, DEFAULT_NAME, DEFAULT_PORT);
  await updateJsoncBinding(WRANGLER_JSONC, BINDING_NAME, D1_NAME, db.uuid);
  console.log('✅ 所有步骤完成');
}

main().catch(err => {
  console.error('❌ 出错了:', err);
  process.exit(1);
});
