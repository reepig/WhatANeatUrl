// 后台脚本：处理 URL 清理和导航

// 默认要移除的参数列表
const DEFAULT_PARAMS_TO_REMOVE = ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

// 初始化存储的参数列表
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['paramsToRemove', 'isEnabled'], (result) => {
    if (!result.paramsToRemove) {
      chrome.storage.local.set({ paramsToRemove: DEFAULT_PARAMS_TO_REMOVE });
    }
    if (result.isEnabled === undefined) {
      chrome.storage.local.set({ isEnabled: true });
    }
  });
});

// 监听 URL 变化
chrome.webNavigation.onCommitted.addListener((details) => {
  // 只处理主框架的导航
  if (details.frameId !== 0) return;
  
  chrome.storage.local.get(['isEnabled', 'paramsToRemove'], (result) => {
    if (!result.isEnabled) return;
    
    const url = new URL(details.url);
    let hasParams = false;
    
    // 检查是否有要移除的参数
    for (const param of result.paramsToRemove || DEFAULT_PARAMS_TO_REMOVE) {
      if (url.searchParams.has(param)) {
        hasParams = true;
        break;
      }
    }
    
    // 如果有要移除的参数，则清理 URL
    if (hasParams) {
      const cleanUrl = cleanUrlParams(details.url, result.paramsToRemove || DEFAULT_PARAMS_TO_REMOVE);
      if (cleanUrl !== details.url) {
        // 使用 chrome.tabs.update 而不是 history.replaceState 以确保地址栏更新
        chrome.tabs.update(details.tabId, { url: cleanUrl });
      }
    }
  });
}, { url: [{ schemes: ['http', 'https'] }] });

// 清理 URL 参数的函数
function cleanUrlParams(urlString, paramsToRemove) {
  const url = new URL(urlString);
  let modified = false;
  
  for (const param of paramsToRemove) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      modified = true;
    }
  }
  
  // 如果搜索参数为空，则完全移除问号
  if (url.search === '?' || url.search === '') {
    url.search = '';
  }
  
  return modified ? url.toString() : urlString;
}