document.addEventListener('DOMContentLoaded', () => {
    // 获取 DOM 元素
    const enableToggle = document.getElementById('enableToggle');
    const paramList = document.getElementById('paramList');
    const newParamInput = document.getElementById('newParam');
    const addParamButton = document.getElementById('addParam');
    const cleanCurrentUrlButton = document.getElementById('cleanCurrentUrl');
    const cleanLinksBeforeClick = document.getElementById('cleanLinksBeforeClick');
    
    // 加载设置
    loadSettings();
    
    // 添加事件监听器
    enableToggle.addEventListener('change', () => {
      chrome.storage.local.set({ isEnabled: enableToggle.checked });
    });
    
    addParamButton.addEventListener('click', () => {
      const newParam = newParamInput.value.trim();
      if (newParam) {
        chrome.storage.local.get(['paramsToRemove'], (result) => {
          const params = result.paramsToRemove || [];
          if (!params.includes(newParam)) {
            params.push(newParam);
            chrome.storage.local.set({ paramsToRemove: params }, () => {
              loadParamList(params);
              newParamInput.value = '';
            });
          }
        });
      }
    });
    
    cleanCurrentUrlButton.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
          chrome.storage.local.get(['paramsToRemove'], (result) => {
            const cleanUrl = cleanUrlParams(activeTab.url, result.paramsToRemove || []);
            if (cleanUrl !== activeTab.url) {
              chrome.tabs.update(activeTab.id, { url: cleanUrl });
            }
          });
        }
      });
    });
    
    cleanLinksBeforeClick.addEventListener('change', () => {
      chrome.storage.local.set({ cleanLinksBeforeClick: cleanLinksBeforeClick.checked });
    });
    
    // 加载设置
    function loadSettings() {
      const slider = document.querySelector('.slider');
      // 禁用初始动画
      slider.classList.add('no-transition');
      
      chrome.storage.local.get(['isEnabled', 'paramsToRemove', 'cleanLinksBeforeClick'], (result) => {
        enableToggle.checked = result.isEnabled !== false;
        loadParamList(result.paramsToRemove || []);
        cleanLinksBeforeClick.checked = result.cleanLinksBeforeClick || false;

        // 去除禁用动画的类，这样后续的手动切换仍然会有动画效果
        requestAnimationFrame(() => {
          slider.classList.remove('no-transition');
        });
      });
    }
    
    // 加载参数列表
    function loadParamList(params) {
      paramList.innerHTML = '';
      params.forEach(param => {
        const item = document.createElement('div');
        item.className = 'param-item';
        
        const paramText = document.createElement('span');
        paramText.textContent = param;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'btn';
        removeButton.textContent = '删除';
        removeButton.addEventListener('click', () => {
          chrome.storage.local.get(['paramsToRemove'], (result) => {
            const updatedParams = (result.paramsToRemove || []).filter(p => p !== param);
            chrome.storage.local.set({ paramsToRemove: updatedParams }, () => {
              loadParamList(updatedParams);
            });
          });
        });
        
        item.appendChild(paramText);
        item.appendChild(removeButton);
        paramList.appendChild(item);
      });
    }
    
    // 清理 URL 参数的函数
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
        return urlString;
      }
    }
  });