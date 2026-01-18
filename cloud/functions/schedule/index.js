// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 引入各个处理模块
const list = require('./list');
const create = require('./create');
const update = require('./update');
const remove = require('./delete');
const detail = require('./detail');

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, ...params } = event;
  const { OPENID } = cloud.getWXContext();

  // 添加 openid 到参数中
  const eventWithOpenid = { ...params, openid: OPENID };

  console.log(`[Schedule] Action: ${action}, OpenID: ${OPENID}`);

  try {
    switch (action) {
      case 'list':
        return await list(eventWithOpenid, cloud);
      case 'create':
        return await create(eventWithOpenid, cloud);
      case 'update':
        return await update(eventWithOpenid, cloud);
      case 'delete':
        return await remove(eventWithOpenid, cloud);
      case 'detail':
        return await detail(eventWithOpenid, cloud);
      default:
        return {
          success: false,
          code: 'INVALID_ACTION',
          message: '无效的操作'
        };
    }
  } catch (error) {
    console.error(`[Schedule] Error in ${action}:`, error);
    return {
      success: false,
      code: 'INTERNAL_ERROR',
      message: error.message || '服务器内部错误'
    };
  }
};


