/**
 * 时间选择器移动端优化脚本
 * 确保移动端强制使用PC端样式和交互行为
 */

export function initTimePickerMobileFix() {
  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0);

  if (isMobile) {
    // 强制应用PC端样式类
    const applyPCStyles = () => {
      const timeInputs = document.querySelectorAll('input[type="time"]') as NodeListOf<HTMLInputElement>;
      
      timeInputs.forEach(input => {
        // 添加自定义类名以强制PC端样式
        input.classList.add('force-pc-style');
        
        // 防止移动端浏览器的自动样式覆盖
        input.style.setProperty('-webkit-appearance', 'none', 'important');
        input.style.setProperty('-moz-appearance', 'none', 'important');
        input.style.setProperty('appearance', 'none', 'important');
        input.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
        input.style.setProperty('text-size-adjust', '100%', 'important');
        
        // 确保字体样式
        input.style.setProperty('font-family', 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace', 'important');
        input.style.setProperty('font-size', '14px', 'important');
        
        // 优化触摸交互
        input.style.setProperty('touch-action', 'manipulation', 'important');
        input.style.setProperty('user-select', 'text', 'important');
        input.style.setProperty('-webkit-user-select', 'text', 'important');
        
        // 确保最小触摸目标大小（44px是推荐的最小触摸目标）
        const computedStyle = window.getComputedStyle(input);
        const currentHeight = parseInt(computedStyle.height);
        if (currentHeight < 44) {
          input.style.setProperty('min-height', '44px', 'important');
        }
      });
    };

    // 页面加载完成后应用样式
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyPCStyles);
    } else {
      applyPCStyles();
    }

    // 监听DOM变化，确保动态添加的时间选择器也应用样式
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // 检查新添加的元素是否包含时间选择器
              const timeInputs = element.querySelectorAll ? element.querySelectorAll('input[type="time"]') : [];
              if (timeInputs.length > 0 || (element.matches && element.matches('input[type="time"]'))) {
                setTimeout(applyPCStyles, 0); // 异步应用样式
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 添加触摸优化事件监听器
    document.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('input[type="time"]')) {
        // 防止双击缩放
        e.preventDefault();
        target.focus();
      }
    }, { passive: false });

    // 优化时间选择器的键盘输入体验
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'time') {
        // 确保输入值格式正确
        const value = target.value;
        if (value && !/^\d{2}:\d{2}$/.test(value)) {
          // 如果格式不正确，尝试修正
          const numbers = value.replace(/\D/g, '');
          if (numbers.length >= 4) {
            const hours = numbers.substring(0, 2);
            const minutes = numbers.substring(2, 4);
            target.value = `${hours}:${minutes}`;
          }
        }
      }
    });
  }
}

// 添加CSS类定义
export function addTimePickerStyles() {
  const styleId = 'time-picker-mobile-fix-styles';
  
  // 避免重复添加样式
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* 强制PC端样式类 */
    input[type="time"].force-pc-style {
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      appearance: none !important;
      -webkit-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace !important;
      font-size: 14px !important;
      touch-action: manipulation !important;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    
    /* 移动端特殊优化 */
    @media (max-width: 768px), (pointer: coarse) {
      input[type="time"].force-pc-style {
        min-height: 44px !important;
        padding: 12px 16px !important;
      }
      
      input[type="time"].force-pc-style::-webkit-calendar-picker-indicator {
        width: 20px !important;
        height: 20px !important;
        padding: 4px !important;
      }
    }
  `;
  
  document.head.appendChild(style);
}