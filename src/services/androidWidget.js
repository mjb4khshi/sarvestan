/** به‌روزرسانی ویجت اندروید بعد از سنک */
export async function updateAndroidWidget(vm) {
  try {
    const C = globalThis.Capacitor;
    const p = C?.Plugins?.SarvestanWidget;
    if (!p?.update) return false;
    const next = vm?.nextClass;
    const exams = vm?.exams || [];
    const exam = exams[0];
    let themeMode = 'auto';
    try {
      const activeId = localStorage.getItem('sarvestan_theme');
      if (activeId) {
        themeMode = activeId.includes('light') ? 'light' : activeId.includes('dark') ? 'dark' : 'auto';
      }
    } catch {}
    await p.update({
      nextTitle: next?.title || '',
      nextTime: next?.isUpcomingDay ? `${next.dayLabel} ${next.time}` : next?.time || '',
      nextRoom: next?.room || '',
      examTitle: exam?.course || '',
      examDays: exam?.daysLeft ?? -1,
      examDate: exam?.examDate || '',
      gpa: vm?.summary?.gpa || '',
      unitsPassed: vm?.summary?.unitsPassed ? String(vm.summary.unitsPassed) : '',
      termGpa: vm?.summary?.termGpa ? String(vm.summary.termGpa) : '',
      theme: themeMode,
    });
    return true;
  } catch {
    return false;
  }
}

export function isNativeCapacitor() {
  try {
    return Boolean(globalThis.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}