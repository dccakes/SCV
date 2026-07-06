export const DASHBOARD_ADD_TASK_EVENT = 'dashboard:add-task'

export function dispatchDashboardAddTaskEvent() {
  window.dispatchEvent(new CustomEvent(DASHBOARD_ADD_TASK_EVENT))
}
