'use client';

import { useEffect } from 'react';
import { initTimePickerMobileFix, addTimePickerStyles } from '@/lib/time-picker-mobile-fix';

/**
 * 时间选择器移动端优化组件
 * 确保在客户端初始化移动端样式修复
 */
export default function TimePickerMobileFix() {
  useEffect(() => {
    // 添加样式
    addTimePickerStyles();
    
    // 初始化移动端修复
    initTimePickerMobileFix();
  }, []);

  // 这个组件不渲染任何内容，只负责初始化
  return null;
}