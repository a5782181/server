/**
 * 创建响应对象，支持加密数据选项
 * @param {*} code - 状态码
 * @param {*} status - 响应状态
 * @param {*} data - 响应数据
 * @param {*} message - 提示信息
 * @param {boolean} [encrypt=false] - 是否加密数据
 * @returns {object} 响应对象
 */
export const createResponse = (code, status, data = null, message = "") => {
  // console.log("====================================");
  // console.log("createResponse", code, status, data, message);
  // console.log("====================================");
  return { code, status, data, message };
};
