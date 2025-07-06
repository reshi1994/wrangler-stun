import fs from 'fs-extra';
import toml from '@iarna/toml';
import { execa } from 'execa';


const BINDING_NAME = 'LUCKY';
const D1_NAME = 'lucky';
const DEFAULT_NAME = 'webs';
const DEFAULT_PORT = 9999;
const WRANGLER_TOML = './wrangler.toml';

// ✅ 检查是否存在数据库，不存在则创建

async function checkOrCreateDatabase(dbName) {
  const { stdout } = await execa('wrangler', ['d1', 'list', '--json']);
  const dbList = JSON.parse(stdout);
  let db = dbList.find(d => d.name === dbName);

  if (!db) {
    console.log(`⏳ 创建数据库 ${dbName}...`);
    const { stdout: created } = await execa('wrangler', ['d1', 'create', dbName,  '--json']);
    db = JSON.parse(created);
    console.log(`✅ 数据库创建成功，ID: ${db.uuid}`);
    
  } else {
    console.log(`✅ 数据库已存在，ID: ${db.uuid}`);
  }
  await updateTomlBinding(WRANGLER_TOML, BINDING_NAME, D1_NAME, db.uuid);
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

// ✅ 更新 wrangler.toml 绑定配置
function normalizeBinding(b) {
  return b.toLowerCase();
}

async function updateTomlBinding(tomlPath, binding, dbName, dbId) {
  let data = {};
  if (await fs.exists(tomlPath)) {
    data = toml.parse(await fs.readFile(tomlPath, 'utf8'));
  }

  data.d1_databases = data.d1_databases || [];

  // 查找所有重复绑定（不区分大小写）
  const duplicates = data.d1_databases.filter(
    d => normalizeBinding(d.binding) === normalizeBinding(binding)
  );

  // 保留第一个，其余删掉
  if (duplicates.length > 0) {
    const first = duplicates[0];
    first.binding = binding; // 保证大小写一致
    first.database_name = dbName;
    first.database_id = dbId;

    // 清除重复项
    data.d1_databases = data.d1_databases.filter(
      (d, i) =>
        normalizeBinding(d.binding) !== normalizeBinding(binding) || i === data.d1_databases.indexOf(first)
    );

    console.log(`📝 已更新并清理重复 binding="${binding}"`);
  } else {
    data.d1_databases.push({
      binding,
      database_name: dbName,
      database_id: dbId
    });
    console.log(`➕ 已追加 binding="${binding}" 到 wrangler.toml`);
  }

  await fs.writeFile(tomlPath, toml.stringify(data));
}


// ✅ 主函数
async function main() {
  const db = await checkOrCreateDatabase(D1_NAME);
  await initSchema(D1_NAME, DEFAULT_NAME, DEFAULT_PORT);
  await updateTomlBinding(WRANGLER_TOML, BINDING_NAME, D1_NAME, db.uuid);
  console.log('✅ 所有步骤完成');
}

main().catch(err => {
  console.error('❌ 出错了:', err);
  process.exit(1);
});
