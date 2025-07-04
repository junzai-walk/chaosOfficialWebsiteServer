// 检查数据库中的实际数据
const { sequelize } = require('./config/db');
const Contact = require('./models/Contact');

async function checkDatabaseData() {
  try {
    console.log('🔍 检查数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('\n📊 检查contacts表数据...');
    
    // 获取前10条记录
    const contacts = await Contact.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    console.log(`📈 找到 ${contacts.length} 条记录`);
    
    if (contacts.length > 0) {
      console.log('\n📋 数据样本:');
      contacts.forEach((contact, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  ID: ${contact.id}`);
        console.log(`  公司: ${contact.company || 'NULL'}`);
        console.log(`  联系人: ${contact.name || 'NULL'}`);
        console.log(`  电话: ${contact.phone || 'NULL'}`);
        console.log(`  意向: ${contact.wish || 'NULL'}`);
        console.log(`  创建时间: ${contact.createdAt}`);
        console.log(`  更新时间: ${contact.updatedAt}`);
      });

      // 检查字段的空值情况
      console.log('\n📊 字段空值统计:');
      const totalCount = await Contact.count();
      
      const companyNullCount = await Contact.count({ where: { company: null } });
      const nameNullCount = await Contact.count({ where: { name: null } });
      const phoneNullCount = await Contact.count({ where: { phone: null } });
      const wishNullCount = await Contact.count({ where: { wish: null } });
      const wishEmptyCount = await Contact.count({ where: { wish: '' } });

      console.log(`  总记录数: ${totalCount}`);
      console.log(`  公司为空: ${companyNullCount}`);
      console.log(`  联系人为空: ${nameNullCount}`);
      console.log(`  电话为空: ${phoneNullCount}`);
      console.log(`  意向为null: ${wishNullCount}`);
      console.log(`  意向为空字符串: ${wishEmptyCount}`);
    } else {
      console.log('❌ 没有找到任何数据');
    }

  } catch (error) {
    console.error('❌ 检查数据库失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseData();
