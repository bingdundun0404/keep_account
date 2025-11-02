'use client';

import { useState, useEffect } from 'react';

export default function TimePickerTestPage() {
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('07:00');
  const [goalDuration, setGoalDuration] = useState('08:00');
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: 'N/A',
    touchSupport: 'N/A',
    maxTouchPoints: 'N/A',
    screenWidth: 'N/A',
    viewportWidth: 'N/A'
  });

  useEffect(() => {
    // 在客户端设置设备信息
    setDeviceInfo({
      userAgent: window.navigator.userAgent.substring(0, 100) + '...',
      touchSupport: 'ontouchstart' in window ? '是' : '否',
      maxTouchPoints: window.navigator.maxTouchPoints.toString(),
      screenWidth: window.screen.width + 'px',
      viewportWidth: window.innerWidth + 'px'
    });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center mb-8">时间选择器测试页面</h1>
        
        <div className="bg-zinc-800 rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold mb-4">移动端样式一致性测试</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                开始时间
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-zinc-400 mt-1">当前值: {startTime}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                结束时间
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-zinc-400 mt-1">当前值: {endTime}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                目标睡眠时长
              </label>
              <input
                type="time"
                value={goalDuration}
                onChange={(e) => setGoalDuration(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-zinc-400 mt-1">当前值: {goalDuration}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">测试说明</h3>
          <div className="space-y-2 text-sm text-zinc-300">
            <p>• 在移动设备上，时间选择器应该使用与PC端一致的样式</p>
            <p>• 字体应为等宽字体 (monospace)</p>
            <p>• 背景色应为深色主题</p>
            <p>• 触摸目标应足够大 (最小44px)</p>
            <p>• 不应出现系统默认的移动端时间选择器样式</p>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">设备信息</h3>
          <div className="space-y-1 text-sm text-zinc-300">
            <p>User Agent: {deviceInfo.userAgent}</p>
            <p>Touch Support: {deviceInfo.touchSupport}</p>
            <p>Max Touch Points: {deviceInfo.maxTouchPoints}</p>
            <p>Screen Width: {deviceInfo.screenWidth}</p>
            <p>Viewport Width: {deviceInfo.viewportWidth}</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}