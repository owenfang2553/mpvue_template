import Fly from 'flyio/dist/npm/wx'
import store from '../store'
import {getToken,getRootId} from './auth'

const fly      = new Fly()
const dev_host = 'https://test.vip.ececloud.cn'  //本地服务请求路径
const pro_host = 'https://test.vip.ececloud.cn'  //服务器服务请求路径

//添加请求拦截器
fly.interceptors.request.use((request) => {
  // request.headers["X-Tag"] = "flyio";
  // request.headers['content-type']= 'application/json';
  request.headers = {
    'X-Tag': 'flyio',
    // 'Content-Type': 'application/json'
    'Content-Type': 'application/x-www-form-urlencoded',
    'apptype'     : 100,
    'clienttype'  : 100
  }
  if (store.getters.token) {
    request.headers['accesstoken'] = getToken()  // 让每个请求携带自定义token 请根据实际情况自行修改
  }

  if (store.getters.rootId) {
    request.headers['root'] = getRootId()
  }
  // request.headers['accesstoken'] = 'PzjMOE-1573810236466'
  // request.headers['root'] = 3

  // let authParams = {
  //   //公共参数
  // }
  let ret  = ''
  let data = request.body
  for (const key in data) {
    let newKey = encodeURIComponent(key)
    // 检查value值 如果值为数组或对象 先转成Json字符串 再传值
    let newValue = ''
    if (typeof data[key] === 'object' && data[key] !== null && data[key] !== undefined) {
      // console.log('监测到对象元素' + key)
      newValue = encodeURIComponent(JSON.stringify(data[key]))
    } else {
      newValue = encodeURIComponent(data[key])
    }
    ret += newKey + '=' + newValue + '&'
  }
  ret = ret.substring(0, ret.length - 1)
  //
  // request.body && Object.keys(request.body).forEach((val) => {
  //   if (request.body[val] === '') {
  //     delete request.body[val]
  //   }
  // })
  // request.body = {
  //   ...request.body,
  //   ...authParams
  // }
  request.body = ret
  return request
})

//添加响应拦截器
fly.interceptors.response.use(
  response => {
    /**
     * code为非20000是抛错 可结合自己业务进行修改
     */
    const res = response.data
    if (res && res.status === undefined) {
      // 国籍、民族
      return response.data
    } else {
      if (res.status === 'fail') {
        let title = ''
        switch (res.code) {
          case 40001: 
            title = '登录失效,请重新登录'
            break
          case 40003: 
            title = '无相应权限,请重新登录'
            break
          case 40608: 
          case 40610: 
            title = '您的账号未开通或已过期'
            break
          default: 
            title = res.message || '系统异常'
        }
        wx.showToast({
          title   : title,
          icon    : 'none',
          duration: 3 * 1000
        })
        return Promise.reject(response.data)
      } else {
        return response.data
      }
    }
  },
  error => {
    console.log(error)
    wx.showToast({
      title   : error.message || '系统错误',
      icon    : 'none',
      duration: 3 * 1000
    })
    return Promise.reject(error.message)
  }
)
// 根据当前环境判断使用哪个基础api
if (process.env.NODE_ENV === 'production') {
  fly.config.baseURL = pro_host
} else {
  fly.config.baseURL = dev_host
}

export default fly
