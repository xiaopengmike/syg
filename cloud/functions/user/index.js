// 云函数入口文件 - user
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 引入各个处理模块
const loginHandler = require('./login');
const bindHandler = require('./bind');
const getPhoneHandler = require('./getPhone');
const registerHandler = require('./register');
const listHandler = require('./list');
const addHandler = require('./add');
const detailHandler = require('./detail');
const inviteHandler = require('./invite');
const deleteHandler = require('./delete');
const initHandler = require('./init');
const approveHandler = require('./approve');
const pendingHandler = require('./pending');

// 云函数入口函数
exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  
  // 将 openid 注入到 event 中
  event.openid = wxContext.OPENID;
  
  // 根据 action 分发到不同的处理函数
  switch (action) {
    case 'login':
      return await loginHandler(event, db);
      
    case 'bind':
      return await bindHandler(event, db, wxContext);
      
    case 'getPhone':
      return await getPhoneHandler(event, cloud);
      
    case 'register':
      return await registerHandler(event, cloud);
      
    case 'list':
      return await listHandler(event, cloud);
      
    case 'add':
      return await addHandler(event, cloud);
      
    case 'detail':
      return await detailHandler(event, cloud);
      
    case 'invite':
      return await inviteHandler(event, cloud);
      
    case 'delete':
      return await deleteHandler(event, cloud);
      
    case 'init':
      return await initHandler(event, cloud);
      
    case 'approve':
      return await approveHandler(event, cloud);
      
    case 'pending':
      return await pendingHandler(event, cloud);
      
    case 'getInviteInfo':
      return await getInviteInfo(event, db);
      
    case 'getUserInfo':
      return await getUserInfo(event, db, wxContext);
      
    default:
      return {
        success: false,
        code: 'INVALID_ACTION',
        message: '无效的操作'
      };
  }
};

/**
 * 获取邀请信息
 */
async function getInviteInfo(event, db) {
  const { code } = event;
  
  if (!code) {
    return {
      success: false,
      code: 'INVALID_CODE',
      message: '邀请码不能为空'
    };
  }
  
  try {
    // 查询邀请记录
    const inviteRes = await db.collection('invites').where({
      code: code,
      status: 'pending'
    }).get();
    
    if (inviteRes.data.length === 0) {
      return {
        success: false,
        code: 'INVITE_NOT_FOUND',
        message: '邀请不存在或已失效'
      };
    }
    
    const invite = inviteRes.data[0];
    
    // 检查是否过期
    if (new Date(invite.expireTime) < new Date()) {
      return {
        success: false,
        code: 'INVITE_EXPIRED',
        message: '邀请已过期'
      };
    }
    
    // 查询目标用户信息
    const targetUserRes = await db.collection('users').doc(invite.targetUserId).get();
    const targetUser = targetUserRes.data;
    
    // 查询邀请人信息
    const inviterRes = await db.collection('users').doc(invite.inviterId).get();
    const inviter = inviterRes.data;
    
    return {
      success: true,
      data: {
        inviteId: invite._id,
        inviterName: inviter.name,
        inviterRole: inviter.role,
        targetName: targetUser.name,
        targetRole: targetUser.role,
        subject: targetUser.subject,
        className: targetUser.className
      }
    };
  } catch (error) {
    console.error('获取邀请信息失败:', error);
    return {
      success: false,
      code: 'SYSTEM_ERROR',
      message: '系统错误'
    };
  }
}

/**
 * 获取当前用户信息
 */
async function getUserInfo(event, db, wxContext) {
  const openid = wxContext.OPENID;
  const { userId } = event;
  
  try {
    let user = null;

    // 优先使用 userId 查询
    if (userId) {
      try {
        const userRes = await db.collection('users').doc(userId).get();
        if (userRes.data) {
          user = userRes.data;
        }
      } catch (e) {
        console.log('[getUserInfo] userId查询失败:', e.message);
      }
    }

    // 回退到 openid 查询
    if (!user && openid) {
      const userRes = await db.collection('users').where({
        _openid: openid
      }).get();
      if (userRes.data.length > 0) {
        user = userRes.data[0];
      }
    }
    
    if (!user) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在'
      };
    }
    
    return {
      success: true,
      data: {
        userId: user._id,
        openid: user._openid,
        phone: user.phone,
        role: user.role,
        name: user.name,
        avatar: user.avatar,
        subject: user.subject,
        className: user.className
      }
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      code: 'SYSTEM_ERROR',
      message: '系统错误'
    };
  }
}

