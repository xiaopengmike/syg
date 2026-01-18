// 获取手机号处理模块

/**
 * 获取手机号
 */
module.exports = async function getPhone(event, cloud) {
  const { code } = event;
  
  if (!code) {
    return {
      success: false,
      code: 'INVALID_PARAMS',
      message: 'code 不能为空'
    };
  }
  
  try {
    // 调用微信接口获取手机号
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code
    });
    
    if (result.errCode === 0) {
      return {
        success: true,
        data: {
          phone: result.phoneInfo.phoneNumber,
          purePhone: result.phoneInfo.purePhoneNumber,
          countryCode: result.phoneInfo.countryCode
        }
      };
    } else {
      return {
        success: false,
        code: 'GET_PHONE_FAILED',
        message: '获取手机号失败'
      };
    }
  } catch (error) {
    console.error('获取手机号失败:', error);
    return {
      success: false,
      code: 'SYSTEM_ERROR',
      message: '获取手机号失败'
    };
  }
};





