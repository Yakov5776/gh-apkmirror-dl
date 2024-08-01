// fetch.js
export const fetchHeaders = async (url, args = {}) => {
  args.headers = args.headers || {}
  args.headers['user-agent'] = 'my own'
  args.headers['user-agent'] = 'APKUpdater-v0'
  args.headers['authorization'] = 'Basic YXBpLWFwa3VwZGF0ZXI6cm01cmNmcnVVakt5MDRzTXB5TVBKWFc4'
  return fetch(url, args)
}