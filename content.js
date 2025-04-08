// 内容脚本：处理页面中的链接

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageLinks') {
      // 获取页面中的所有链接
      const links = Array.from(document.getElementsByTagName('a'))
        .map(a => a.href)
        .filter(href => href && href.includes('?'));
      
      sendResponse({ links });
    }
  });
  
  // 根据设置，在用户点击链接前清理
  function setupLinkCleaning() {
    chrome.storage.local.get(['isEnabled', 'cleanLinksBeforeClick'], (result) => {
      if (!result.isEnabled || !result.cleanLinksBeforeClick) return;
      
      // 为所有链接添加点击事件监听器
      document.addEventListener('click', (e) => {
        // 检查点击是否是链接
        const link = e.target.closest('a');
        if (link && link.href) {
          chrome.storage.local.get(['paramsToRemove'], (result) => {
            const cleanHref = cleanUrlParams(link.href, result.paramsToRemove || DEFAULT_PARAMS_TO_REMOVE);
            if (cleanHref !== link.href) {
              link.href = cleanHref;
            }
          });
        }
      }, true);
    });
  }
  
  // 页面加载完成后设置链接清理
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLinkCleaning);
  } else {
    setupLinkCleaning();
  }
  
  // 清理 URL 参数的函数（与 background.js 中相同）
  function cleanUrlParams(urlString, paramsToRemove) {
    try {
      const url = new URL(urlString);
      let modified = false;
      
      for (const param of paramsToRemove) {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          modified = true;
        }
      }
      
      if (url.search === '?' || url.search === '') {
        url.search = '';
      }
      
      return modified ? url.toString() : urlString;
    } catch (e) {
      return urlString;  // 如果 URL 无效，则返回原始字符串
    }
  }